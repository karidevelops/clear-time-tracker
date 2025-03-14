
import { Link } from 'react-router-dom';
import { Clock, BarChart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="time-tracker-header sticky top-0 z-10 border-b border-gray-200">
      <div className="time-tracker-container">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <Clock className="h-8 w-8 text-reportronic-600" />
            <span className="text-xl font-bold text-reportronic-800">TimeTracker</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-reportronic-600 transition-colors">
              Dashboard
            </Link>
            <Link to="/weekly" className="text-gray-700 hover:text-reportronic-600 transition-colors">
              Weekly View
            </Link>
            <Link to="/reports" className="text-gray-700 hover:text-reportronic-600 transition-colors">
              Reports
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button size="sm" variant="outline" className="hidden md:flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </Button>
            <Button size="sm" className="bg-reportronic-600 hover:bg-reportronic-700">
              <Clock className="h-4 w-4 mr-2" />
              <span>Log Time</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
