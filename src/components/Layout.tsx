
import { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-8">
        <div className="time-tracker-container">
          {children}
        </div>
      </main>
      <footer className="bg-reportronic-900 text-white py-6">
        <div className="time-tracker-container">
          <div className="text-sm text-center">
            © {new Date().getFullYear()} Time Tracker - Inspired by Reportronic
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
