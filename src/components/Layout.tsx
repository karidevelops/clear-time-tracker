
import { ReactNode } from 'react';
import Header from './Header';
import { useLanguage } from '@/context/LanguageContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-8">
        <div className="time-tracker-container">
          {children}
        </div>
      </main>
      <footer className="bg-reportronic-500 text-white py-6">
        <div className="time-tracker-container">
          <div className="text-sm text-center">
            © {new Date().getFullYear()} Time Tracker - {t('inspired_by')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
