
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Settings as SettingsIcon, LogOut, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  Menubar, 
  MenubarContent, 
  MenubarItem, 
  MenubarMenu, 
  MenubarSeparator, 
  MenubarSub, 
  MenubarSubContent, 
  MenubarSubTrigger, 
  MenubarTrigger 
} from "@/components/ui/menubar";
import { clients } from '@/data/ClientsData';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fi, sv, enUS } from 'date-fns/locale';
import TimeEntry from './TimeEntry';
import { useAuth } from '@/context/AuthContext';
import TodayEntries from './TodayEntries';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

const Header = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [date, setDate] = useState<Date>(new Date());
  const [showTimeEntry, setShowTimeEntry] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { signOut, user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  useEffect(() => {
    if (user) {
      setSelectedUser({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
      });
    }
  }, [user]);
  
  useEffect(() => {
    const checkIfAdmin = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }
        
        setIsAdmin(data || false);
        
        if (data) {
          fetchAllUsers();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    const fetchAllUsers = async () => {
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name');
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }
        
        const usersWithEmail: User[] = [];
        
        for (const profile of profiles) {
          // Create user object with available data
          // Since we don't have direct access to emails from profiles table,
          // we'll use the ID as a placeholder or other identification
          usersWithEmail.push({
            id: profile.id,
            email: profile.id, // Using ID as placeholder since email isn't directly available
            full_name: profile.full_name || profile.id.substring(0, 8) // Use first 8 chars of ID if no name
          });
        }
        
        setAllUsers(usersWithEmail);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    checkIfAdmin();
  }, [user]);
  
  const getLocale = () => {
    switch (language) {
      case 'fi':
        return fi;
      case 'sv':
        return sv;
      default:
        return enUS;
    }
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setShowTimeEntry(true);
    }
  };

  const handleLogTime = () => {
    navigate('/');
    setTimeout(() => {
      const timeEntryCard = document.querySelector('.time-tracker-header + div .card');
      if (timeEntryCard) {
        timeEntryCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleTimeEntrySaved = () => {
    // Force a refresh of the current route to update the data
    const currentPath = location.pathname;
    navigate('/', { replace: true });
    setTimeout(() => {
      navigate(currentPath, { replace: true });
    }, 100);
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return path !== '/' && location.pathname.startsWith(path);
  };

  const getLinkClasses = (path: string) => {
    const baseClasses = "transition-colors px-3 py-2";
    return isActive(path)
      ? `${baseClasses} text-reportronic-500 font-medium border-b-2 border-reportronic-500`
      : `${baseClasses} text-gray-700 hover:text-reportronic-500`;
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const handleUserChange = (userId: string) => {
    const newSelectedUser = allUsers.find(u => u.id === userId);
    if (newSelectedUser) {
      setSelectedUser(newSelectedUser);
      
      // Force refresh the current view after user change
      const currentPath = location.pathname;
      navigate('/', { replace: true });
      setTimeout(() => {
        navigate(currentPath, { replace: true });
      }, 100);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getDisplayName = () => {
    if (!selectedUser) return '';
    return selectedUser.full_name || selectedUser.email.split('@')[0] || '';
  };

  return (
    <header className="reportronic-header sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="reportronic-container">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/e97d7c3c-c424-4921-a787-aa1f71cd6d8f.png" 
              alt="Reportronic Logo" 
              className="h-8 w-auto" 
            />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-2">
            <Link to="/" className={getLinkClasses('/')}>
              {t('dashboard')}
            </Link>
            
            <Link to="/weekly" className={getLinkClasses('/weekly')}>
              {t('weekly_view')}
            </Link>
            
            <Link to="/reports" className={getLinkClasses('/reports')}>
              {t('reports')}
            </Link>
            
            {isAdmin && (
              <Link to="/settings" className={getLinkClasses('/settings')}>
                {t('settings')}
              </Link>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            {isAdmin && allUsers.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="hidden md:flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{getDisplayName()}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t('select_user')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {allUsers.map(u => (
                      <DropdownMenuItem 
                        key={u.id} 
                        onClick={() => handleUserChange(u.id)}
                        className={selectedUser?.id === u.id ? "bg-gray-100" : ""}
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>{getUserInitials(u.full_name || u.id)}</AvatarFallback>
                        </Avatar>
                        <span>{u.full_name || u.id.substring(0, 8)}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="hidden md:flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{getDisplayName()}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={handleCalendarSelect}
                    locale={getLocale()}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}

            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="text-gray-500 hover:text-reportronic-600"
                title={t('logout') || 'Kirjaudu ulos'}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {showTimeEntry && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{format(date, 'PPP', { locale: getLocale() })}</h2>
            <TimeEntry 
              initialDate={format(date, 'yyyy-MM-dd')}
              onEntrySaved={handleTimeEntrySaved}
              userId={selectedUser?.id}
            />
            
            <div className="mt-6">
              <h3 className="text-md font-medium mb-3">Tämän päivän kirjaukset</h3>
              <TodayEntries 
                onEntrySaved={handleTimeEntrySaved}
                onEntryDeleted={handleTimeEntrySaved}
                inDialog={true}
                userId={selectedUser?.id}
              />
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowTimeEntry(false)}>
                Sulje
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
