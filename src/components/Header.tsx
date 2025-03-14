
import { Link } from 'react-router-dom';
import { BarChart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const { t } = useLanguage();
  
  return (
    <header className="time-tracker-header sticky top-0 z-10 border-b border-gray-200">
      <div className="time-tracker-container">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/e97d7c3c-c424-4921-a787-aa1f71cd6d8f.png" 
              alt="Reportronic Logo" 
              className="h-8 w-auto" 
            />
            <span className="text-xl font-bold text-reportronic-600 hidden md:inline-flex">{t('timetracker')}</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-reportronic-500 transition-colors">
              {t('dashboard')}
            </Link>
            <Link to="/weekly" className="text-gray-700 hover:text-reportronic-500 transition-colors">
              {t('weekly_view')}
            </Link>
            <Link to="/reports" className="text-gray-700 hover:text-reportronic-500 transition-colors">
              {t('reports')}
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Button size="sm" variant="outline" className="hidden md:flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{t('calendar')}</span>
            </Button>
            <Button size="sm" className="bg-reportronic-500 hover:bg-reportronic-600 text-white">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{t('log_time')}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
