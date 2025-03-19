
import { Link } from 'react-router-dom';
import { BarChart, Calendar, FileText, Settings as SettingsIcon, LogOut } from 'lucide-react';
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fi, sv, enUS } from 'date-fns/locale';
import TimeEntry from './TimeEntry';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [showTimeEntry, setShowTimeEntry] = useState(false);
  const { signOut } = useAuth();
  
  // Get date-fns locale based on current language
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
    // Navigate to home page where the time entry form is
    navigate('/');
    // We can scroll to the time entry form if needed
    setTimeout(() => {
      const timeEntryCard = document.querySelector('.time-tracker-header + div .card');
      if (timeEntryCard) {
        timeEntryCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleTimeEntrySaved = () => {
    setShowTimeEntry(false);
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
            <Link to="/" className="text-gray-700 hover:text-reportronic-500 transition-colors px-3 py-2">
              {t('dashboard')}
            </Link>
            
            <Link to="/settings" className="text-gray-700 hover:text-reportronic-500 transition-colors px-3 py-2">
              {t('settings')}
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="hidden md:flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{t('calendar')}</span>
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

            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={signOut}
                className="text-gray-500 hover:text-reportronic-600"
                title={t('logout') || 'Logout'}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {showTimeEntry && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{format(date, 'PPP', { locale: getLocale() })}</h2>
            <TimeEntry 
              initialDate={format(date, 'yyyy-MM-dd')}
              onEntrySaved={handleTimeEntrySaved}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowTimeEntry(false)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
