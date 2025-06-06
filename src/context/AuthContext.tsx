
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AuthContextType = {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
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

  useEffect(() => {
    // First set up the auth listener, then check for initial session
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
        
        if (event === 'SIGNED_IN') {
          toast.success('Signed in successfully');
        }
        
        if (event === 'SIGNED_OUT') {
          toast.success('Signed out successfully');
        }

        if (event === 'USER_UPDATED') {
          toast.success('User profile updated');
        }

        if (event === 'PASSWORD_RECOVERY') {
          toast.info('Password recovery initiated');
        }
      }
    );

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
      } catch (error) {
        console.error('Exception getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Clear local session state first
      setUser(null);
      setSession(null);
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // If we get a session missing error, we're already signed out, so we can ignore it
        if (error.message === 'Auth session missing!' || 
            error.name === 'AuthSessionMissingError') {
          // This is fine, it means we're already signed out
          toast.success('Signed out successfully');
          return;
        }
        
        // Handle other errors
        console.error('Error signing out:', error);
        toast.error('Error signing out');
        return;
      }
      
      // We don't need to manually update state here as the onAuthStateChange listener will handle it
      // The toast is also shown by the listener when it detects the SIGNED_OUT event
    } catch (error) {
      console.error('Exception in signOut:', error);
      toast.error('Error signing out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
