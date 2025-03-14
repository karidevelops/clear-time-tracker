
import { Link } from 'react-router-dom';
import { BarChart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="time-tracker-header sticky top-0 z-10 border-b border-gray-200">
      <div className="time-tracker-container">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="https://www.reportronic.fi/wp-content/uploads/2022/09/reportronic-logo-1.svg" 
              alt="Reportronic Logo" 
              className="h-8 w-auto" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://www.reportronic.fi/wp-content/uploads/2023/07/cropped-reportronic-logo.png";
              }}
            />
            <span className="text-xl font-bold text-reportronic-600 hidden md:inline-flex">TimeTracker</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-reportronic-500 transition-colors">
              Dashboard
            </Link>
            <Link to="/weekly" className="text-gray-700 hover:text-reportronic-500 transition-colors">
              Weekly View
            </Link>
            <Link to="/reports" className="text-gray-700 hover:text-reportronic-500 transition-colors">
              Reports
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button size="sm" variant="outline" className="hidden md:flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </Button>
            <Button size="sm" className="bg-reportronic-500 hover:bg-reportronic-600 text-white">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Log Time</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
