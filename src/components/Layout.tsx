
import { ReactNode } from 'react';
import Header from './Header';
import { useLanguage } from '@/context/LanguageContext';
import ChatWindow from './chat/ChatWindow';
import { useFooter } from '@/context/FooterContext';
import { useBanner } from '@/context/BannerContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { t } = useLanguage();
  const { footerColor } = useFooter();
  const { bannerText } = useBanner();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-8">
        <div className="reportronic-container">
          {children}
        </div>
      </main>
      <footer className={`${footerColor} text-white py-6 transition-colors duration-300`}>
        <div className="reportronic-container">
          <div className="text-sm text-center">
            © {new Date().getFullYear()} Reportronic - {t('inspired_by')}
          </div>
        </div>
      </footer>
      <ChatWindow />
    </div>
  );
};

export default Layout;
