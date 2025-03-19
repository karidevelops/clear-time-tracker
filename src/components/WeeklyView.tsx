import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, isToday, isSameDay, addWeeks, subWeeks, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';
import TimeEntry from './TimeEntry';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { TimeEntry as TimeEntryType, TimeEntryStatus } from '@/types/timeEntry';

const WeeklyView = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTimeEntry, setShowTimeEntry] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntryType[]>([]);
  const [dailyHours, setDailyHours] = useState<{[key: string]: number}>({});

  // Set up the days for the current week
  useEffect(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday as start of week
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];
    
    for (let day = start; day <= end; day = addDays(day, 1)) {
      days.push(day);
    }
    
    setWeekDays(days);
  }, [currentDate]);

  // Fetch time entries for the displayed week
  useEffect(() => {
    if (!user) return;
    
    const fetchTimeEntries = async () => {
      const start = format(weekDays[0] || startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(weekDays[6] || endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('*, profiles(*), projects(*)')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching time entries:', error);
        return;
      }
      
      // Cast the data to ensure status is of type TimeEntryStatus
      const typedData = (data || []).map(entry => ({
        ...entry,
        status: entry.status as TimeEntryStatus
      })) as TimeEntryType[];
      
      setTimeEntries(typedData);
      
      // Calculate daily hours
      const hours: {[key: string]: number} = {};
      typedData.forEach((entry: TimeEntryType) => {
        const dateKey = entry.date;
        if (!hours[dateKey]) {
          hours[dateKey] = 0;
        }
        hours[dateKey] += Number(entry.hours);
      });
      
      setDailyHours(hours);
    };
    
    fetchTimeEntries();
  }, [weekDays, user, currentDate]);

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setShowTimeEntry(true);
  };

  const handleTimeEntrySaved = () => {
    // Refresh time entries after saving
    const fetchTimeEntries = async () => {
      const start = format(weekDays[0] || startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(weekDays[6] || endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('*, profiles(*), projects(*)')
        .eq('user_id', user?.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching time entries:', error);
        return;
      }
      
      // Cast the data to ensure status is of type TimeEntryStatus
      const typedData = (data || []).map(entry => ({
        ...entry,
        status: entry.status as TimeEntryStatus
      })) as TimeEntryType[];
      
      setTimeEntries(typedData);
      
      // Calculate daily hours
      const hours: {[key: string]: number} = {};
      typedData.forEach((entry: TimeEntryType) => {
        const dateKey = entry.date;
        if (!hours[dateKey]) {
          hours[dateKey] = 0;
        }
        hours[dateKey] += Number(entry.hours);
      });
      
      setDailyHours(hours);
    };
    
    fetchTimeEntries();
    setShowTimeEntry(false);
  };

  // Group time entries by date
  const entriesByDate: { [key: string]: TimeEntryType[] } = {};
  timeEntries.forEach(entry => {
    if (!entriesByDate[entry.date]) {
      entriesByDate[entry.date] = [];
    }
    entriesByDate[entry.date].push(entry);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">{t('weekly_view')}</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
              className="h-8 w-8 p-0"
            >
              &lt;
            </Button>
            <span className="flex h-8 items-center px-2">
              {format(weekDays[0] || new Date(), 'd.M', { locale: fi })} - {format(weekDays[6] || new Date(), 'd.M', { locale: fi })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="h-8 w-8 p-0"
            >
              &gt;
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`p-2 border rounded ${isToday(day) ? 'border-reportronic-500 bg-reportronic-50' : 'border-gray-200'}`}
              >
                <div className="text-center">
                  <div className="font-medium">{format(day, 'EEEEEE', { locale: fi })}</div>
                  <div 
                    className={`text-lg cursor-pointer hover:text-reportronic-500 ${isToday(day) ? 'text-reportronic-500 font-bold' : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    {format(day, 'd')}
                  </div>
                  
                  {/* Show hours logged for this day */}
                  <div className="mt-2 mb-2">
                    {dailyHours[format(day, 'yyyy-MM-dd')] !== undefined ? (
                      <Badge className="bg-reportronic-500">
                        {dailyHours[format(day, 'yyyy-MM-dd')].toFixed(2)} h
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-400">
                        0 h
                      </Badge>
                    )}
                  </div>
                  
                </div>
                <div className="mt-1 space-y-1">
                  {entriesByDate[format(day, 'yyyy-MM-dd')]?.map((entry, idx) => (
                    <div 
                      key={idx} 
                      className="text-xs p-1 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="font-medium truncate">
                        {entry.hours} h
                      </div>
                      <div className="truncate text-gray-600">
                        {entry.description?.substring(0, 20)}{entry.description && entry.description.length > 20 ? '...' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Table showing all time entries for the week */}
          <div className="mt-8">
            <h3 className="font-medium text-lg mb-3">{t('weekly_entries')}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('hours')}</TableHead>
                  <TableHead>{t('project')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.length > 0 ? (
                  timeEntries.map((entry) => (
                    <TableRow key={entry.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                      setSelectedDate(parseISO(entry.date));
                      setShowTimeEntry(true);
                    }}>
                      <TableCell>{format(parseISO(entry.date), 'dd.MM.yyyy')}</TableCell>
                      <TableCell>{entry.hours.toFixed(2)} h</TableCell>
                      <TableCell>{entry.project_id}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{entry.description}</TableCell>
                      <TableCell>
                        {entry.status === 'draft' && <Badge variant="outline" className="text-gray-600 border-gray-300">{t('draft')}</Badge>}
                        {entry.status === 'pending' && <Badge variant="outline" className="text-orange-600 border-orange-300">{t('pending_approval')}</Badge>}
                        {entry.status === 'approved' && <Badge variant="outline" className="text-green-600 border-green-300">{t('approved')}</Badge>}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      {t('no_time_entries')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {showTimeEntry && selectedDate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {format(selectedDate, 'dd.MM.yyyy', { locale: fi })}
            </h2>
            <TimeEntry 
              initialDate={format(selectedDate, 'yyyy-MM-dd')}
              onEntrySaved={handleTimeEntrySaved}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowTimeEntry(false)}>
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyView;
