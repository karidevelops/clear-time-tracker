
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday } from 'date-fns';
import { fi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import TimeEntry from './TimeEntry';
import { useLanguage } from '@/context/LanguageContext';

// Target working hours
const DAILY_TARGET_HOURS = 7.5;
const WEEKLY_TARGET_HOURS = 37.5;

// Mock data for time entries
// In a real app, this would come from an API
const mockTimeEntries = [
  { id: '1', date: '2023-07-10', hours: 4.5, project: 'Website Development' },
  { id: '2', date: '2023-07-10', hours: 3, project: 'Mobile App' },
  { id: '3', date: '2023-07-11', hours: 8, project: 'UI/UX Design' },
  { id: '4', date: '2023-07-12', hours: 6, project: 'Website Development' },
  { id: '5', date: '2023-07-13', hours: 7.5, project: 'Backend API' },
  { id: '6', date: '2023-07-14', hours: 5, project: 'Documentation' },
];

const WeeklyView = () => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const [weekEnd, setWeekEnd] = useState(endOfWeek(currentDate, { weekStartsOn: 1 }));
  const [days, setDays] = useState<Date[]>([]);
  const [timeEntries, setTimeEntries] = useState(mockTimeEntries);

  useEffect(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    setWeekStart(start);
    setWeekEnd(end);
    setDays(eachDayOfInterval({ start, end }));
  }, [currentDate]);

  const goToPreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  // Get entries for a specific day
  const getEntriesForDay = (day: Date) => {
    const dateString = format(day, 'yyyy-MM-dd');
    return timeEntries.filter((entry) => entry.date === dateString);
  };

  // Calculate total hours for a day
  const getTotalHoursForDay = (day: Date) => {
    const entries = getEntriesForDay(day);
    return entries.reduce((total, entry) => total + entry.hours, 0);
  };

  // Calculate remaining hours for a day
  const getRemainingHoursForDay = (day: Date) => {
    const totalHours = getTotalHoursForDay(day);
    return DAILY_TARGET_HOURS - totalHours;
  };

  // Calculate total hours for the week
  const getTotalHoursForWeek = () => {
    return days.reduce((total, day) => total + getTotalHoursForDay(day), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-reportronic-800">{t('weekly_overview')}</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            className="min-w-32"
            size="sm" 
            onClick={goToCurrentWeek}
          >
            <Calendar className="h-4 w-4 mr-2" />
            <span>{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-reportronic-50 py-4 px-6">
          <div className="grid grid-cols-7 gap-2 text-center">
            {days.map((day) => (
              <div key={day.toString()} className="font-medium text-sm text-gray-700">
                <div>{format(day, 'EEE', { locale: fi })}</div>
                <div className={cn(
                  "mt-1 rounded-full w-7 h-7 flex items-center justify-center mx-auto",
                  isToday(day) && "bg-reportronic-600 text-white"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {days.map((day) => {
              const entries = getEntriesForDay(day);
              const totalHours = getTotalHoursForDay(day);
              const remainingHours = getRemainingHoursForDay(day);
              const dateStr = format(day, 'yyyy-MM-dd');
              
              return (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "time-cell bg-white p-3",
                    isToday(day) && "bg-reportronic-50"
                  )}
                >
                  {entries.length > 0 ? (
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <div 
                          key={entry.id} 
                          className="text-xs p-2 rounded border-l-4 border-reportronic-400 bg-reportronic-50"
                        >
                          <div className="font-medium truncate">{entry.project}</div>
                          <div className="text-reportronic-700">{entry.hours}h</div>
                        </div>
                      ))}
                      <div className="text-xs text-gray-500 text-right mt-1">
                        {t('total')}: <span className="font-medium">{totalHours}h</span>
                        <div className={cn(
                          "text-xs",
                          remainingHours > 0 ? "text-orange-500" : "text-green-500"
                        )}>
                          {remainingHours > 0 
                            ? `${remainingHours}h ${t('remaining')}` 
                            : `${Math.abs(remainingHours)}h ${t('over')}`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-reportronic-600">
                            <Plus className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <TimeEntry />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center p-4 bg-reportronic-50 rounded-lg">
        <div className="text-sm font-medium">
          {t('weekly_total')}: <span className="text-reportronic-700">{getTotalHoursForWeek()}h</span>
        </div>
        <div className="text-sm font-medium">
          {t('weekly_target')}: <span className="text-reportronic-700">{WEEKLY_TARGET_HOURS}h</span>
        </div>
        <div className="text-sm font-medium">
          {getTotalHoursForWeek() < WEEKLY_TARGET_HOURS 
            ? <span className="text-orange-500">{(WEEKLY_TARGET_HOURS - getTotalHoursForWeek()).toFixed(1)}h {t('remaining')}</span>
            : <span className="text-green-500">{(getTotalHoursForWeek() - WEEKLY_TARGET_HOURS).toFixed(1)}h {t('over')}</span>
          }
        </div>
      </div>
    </div>
  );
};

export default WeeklyView;
