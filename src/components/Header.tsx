
import { Link } from 'react-router-dom';
import { BarChart, Calendar, FileText, Settings as SettingsIcon } from 'lucide-react';
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

const Header = () => {
  const { t } = useLanguage();
  
  return (
    <header className="time-tracker-header sticky top-0 z-10 border-b border-gray-200 bg-white">
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
          
          <nav className="hidden md:flex items-center space-x-2">
            <Link to="/" className="text-gray-700 hover:text-reportronic-500 transition-colors px-3 py-2">
              {t('dashboard')}
            </Link>
            
            <Menubar className="border-none">
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer font-normal">{t('clients_and_projects')}</MenubarTrigger>
                <MenubarContent>
                  {clients.map((client) => (
                    <MenubarSub key={client.id}>
                      <MenubarSubTrigger>{client.name}</MenubarSubTrigger>
                      <MenubarSubContent>
                        {client.projects.map((project) => (
                          <MenubarItem key={project.id}>{project.name}</MenubarItem>
                        ))}
                      </MenubarSubContent>
                    </MenubarSub>
                  ))}
                  <MenubarSeparator />
                  <MenubarItem>
                    <Link to="/weekly" className="w-full block">
                      {t('weekly_view')}
                    </Link>
                  </MenubarItem>
                  <MenubarItem>
                    <Link to="/reports" className="w-full block">
                      {t('reports')}
                    </Link>
                  </MenubarItem>
                  <MenubarItem>
                    <Link to="/settings" className="w-full block">
                      {t('settings')}
                    </Link>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
            
            <Link to="/reports" className="text-gray-700 hover:text-reportronic-500 transition-colors px-3 py-2">
              {t('reports')}
            </Link>
            
            <Link to="/settings" className="text-gray-700 hover:text-reportronic-500 transition-colors px-3 py-2">
              {t('settings')}
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
