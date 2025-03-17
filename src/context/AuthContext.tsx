
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserRole = 'admin' | 'user';

type AuthContextType = {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  userRole: UserRole | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  userRole: null,
  isAdmin: false,
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Function to fetch user role
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }
      
      const role = data?.role as UserRole;
      setUserRole(role);
      setIsAdmin(role === 'admin');
    } catch (error) {
      console.error('Exception fetching user role:', error);
    }
  };

  useEffect(() => {
    // Set up auth redirect URL to current window location (instead of localhost)
    const setAuthRedirectUrl = async () => {
      const currentUrl = window.location.origin;
      // Clear previous session
      const { error } = await supabase.auth.setSession({
        access_token: "",
        refresh_token: "",
      });
      
      if (error) {
        console.error('Error setting session:', error);
      }
      
      // Set the site URL for redirects
      const { data: settingsData, error: settingsError } = await supabase.auth.updateUser({
        data: { redirect_url: currentUrl }
      });
      
      if (settingsError) {
        console.error('Error setting redirect URL:', settingsError);
      }
    };
    
    setAuthRedirectUrl();
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        // Fetch user role if user is logged in
        if (data.session?.user) {
          await fetchUserRole(data.session.user.id);
        }
      } catch (error) {
        console.error('Exception getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Update user role when auth state changes
        if (newSession?.user) {
          await fetchUserRole(newSession.user.id);
        } else {
          setUserRole(null);
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      userRole,
      isAdmin,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
