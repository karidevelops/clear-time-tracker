import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CalendarDays } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, isToday, isSameDay, addWeeks, subWeeks, parseISO, getWeek } from 'date-fns';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllProjects, getProjectById } from '@/data/ClientsData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { isHolidayOrWeekend, getHolidayName } from '@/utils/dateUtils';
import { useLocation } from 'react-router-dom';

const WeeklyView = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTimeEntry, setShowTimeEntry] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntryType[]>([]);
  const [dailyHours, setDailyHours] = useState<{[key: string]: number}>({});
  const [projectInfo, setProjectInfo] = useState<{[key: string]: {name: string, clientName: string}}>({});
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntryType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState(true);
  const [activeUserId, setActiveUserId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const userIdParam = searchParams.get('userId');
    if (userIdParam) {
      setActiveUserId(userIdParam);
    } else if (user) {
      setActiveUserId(user.id);
    }
  }, [location.search, user]);

  useEffect(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];
    
    for (let day = start; day <= end; day = addDays(day, 1)) {
      days.push(day);
    }
    
    setWeekDays(days);
  }, [currentDate]);

  useEffect(() => {
    fetchProjectInfo();
  }, []);

  const fetchProjectInfo = async () => {
    try {
      const { data, error } = await supabase.from('projects').select(`
        id,
        name,
        client_id,
        clients (
          name
        )
      `);
      if (!error && data && data.length > 0) {
        const projectMap: {[key: string]: {name: string, clientName: string}} = {};
        data.forEach(project => {
          projectMap[project.id] = {
            name: project.name,
            clientName: project.clients?.name || 'Unknown Client'
          };
        });
        setProjectInfo(projectMap);
      } else {
        const projects = getAllProjects();
        const projectMap: {[key: string]: {name: string, clientName: string}} = {};
        projects.forEach(project => {
          const client = project.clientId ? {
            name: 'Unknown Client'
          } : null;
          projectMap[project.id] = {
            name: project.name,
            clientName: client?.name || 'Unknown Client'
          };
        });
        setProjectInfo(projectMap);
      }
    } catch (error) {
      console.error('Error fetching project info:', error);
    }
  };

  const getProjectName = (projectId: string) => {
    return projectInfo[projectId]?.name || projectId;
  };

  const getClientName = (projectId: string) => {
    return projectInfo[projectId]?.clientName || '';
  };

  useEffect(() => {
    if (!activeUserId) return;
    
    const fetchTimeEntries = async () => {
      try {
        const start = format(weekDays[0] || startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const end = format(weekDays[6] || endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from('time_entries')
          .select('*, projects(*)')
          .eq('user_id', activeUserId)
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: true });
        
        if (error) {
          console.error('Error fetching time entries:', error);
          return;
        }
        
        const typedData = (data || []).map(entry => ({
          ...entry,
          status: entry.status as TimeEntryStatus
        })) as TimeEntryType[];
        
        setTimeEntries(typedData);
        
        const hours: {[key: string]: number} = {};
        typedData.forEach((entry: TimeEntryType) => {
          const dateKey = entry.date;
          if (!hours[dateKey]) {
            hours[dateKey] = 0;
          }
          hours[dateKey] += Number(entry.hours);
        });
        
        setDailyHours(hours);
      } catch (error) {
        console.error('Error in fetchTimeEntries:', error);
      }
    };
    
    fetchTimeEntries();
  }, [weekDays, activeUserId, currentDate]);

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
    refreshTimeEntries();
    setShowTimeEntry(false);
  };

  const refreshTimeEntries = async () => {
    if (!activeUserId) return;
    
    try {
      const start = format(weekDays[0] || startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(weekDays[6] || endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('*, projects(*)')
        .eq('user_id', activeUserId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching time entries:', error);
        return;
      }
      
      const typedData = (data || []).map(entry => ({
        ...entry,
        status: entry.status as TimeEntryStatus
      })) as TimeEntryType[];
      
      setTimeEntries(typedData);
      
      const hours: {[key: string]: number} = {};
      typedData.forEach((entry: TimeEntryType) => {
        const dateKey = entry.date;
        if (!hours[dateKey]) {
          hours[dateKey] = 0;
        }
        hours[dateKey] += Number(entry.hours);
      });
      
      setDailyHours(hours);
    } catch (error) {
      console.error('Error in refreshTimeEntries:', error);
    }
  };

  const handleEdit = (entry: TimeEntryType) => {
    setCurrentEntry(entry);
    setIsEditSheetOpen(true);
  };

  const handleDelete = async (entryId: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from('time_entries').delete().eq('id', entryId);
      
      if (error) throw error;
      
      refreshTimeEntries();
      
      toast({
        title: "Kirjaus poistettu",
        description: "Aikakirjaus on poistettu onnistuneesti.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast({
        title: "Virhe poistettaessa",
        description: "Aikakirjausta ei voitu poistaa. Yritä uudelleen.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (entry: TimeEntryType) => {
    if (!activeUserId) return;
    
    const newEntry = {
      date: entry.date,
      description: entry.description,
      hours: entry.hours,
      project_id: entry.project_id,
      user_id: activeUserId,
      status: 'draft' as TimeEntryStatus
    };
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('time_entries').insert(newEntry).select();
      
      if (error) throw error;
      
      refreshTimeEntries();
      
      toast({
        title: "Kopio luotu",
        description: "Aikakirjauksesta on luotu kopio onnistuneesti.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error copying time entry:', error);
      toast({
        title: "Virhe kopioitaessa",
        description: "Kopiointia ei voitu suorittaa. Yritä uudelleen.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntrySaved = (updatedEntry: TimeEntryType) => {
    setIsEditSheetOpen(false);
    refreshTimeEntries();
    toast({
      title: "Kirjaus päivitetty",
      description: "Aikakirjaus on päivitetty onnistuneesti.",
      variant: "default"
    });
    setCurrentEntry(null);
  };

  const entriesByDate: { [key: string]: TimeEntryType[] } = {};
  timeEntries.forEach(entry => {
    if (!entriesByDate[entry.date]) {
      entriesByDate[entry.date] = [];
    }
    entriesByDate[entry.date].push(entry);
  });

  const totalWeekHours = Object.values(dailyHours).reduce((sum, hours) => sum + hours, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">
            {t('weekly_view')}
            <Badge variant="outline" className="ml-2 text-reportronic-500 border-reportronic-300">
              <CalendarDays className="h-3.5 w-3.5 mr-1 inline" />
              {t('week')} {getWeek(weekDays[0] || currentDate, { weekStartsOn: 1 })}
            </Badge>
          </CardTitle>
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
            {weekDays.map((day, i) => {
              const isHoliday = isHolidayOrWeekend(day);
              const holidayName = getHolidayName(day);
              
              return (
                <div
                  key={i}
                  className={`p-2 border rounded ${
                    isToday(day) 
                      ? 'border-reportronic-500 bg-reportronic-50' 
                      : isHoliday 
                        ? 'border-red-200' 
                        : 'border-gray-200'
                  }`}
                >
                  <div className="text-center">
                    <div className={`font-medium ${isHoliday ? 'text-red-600' : ''}`}>
                      {format(day, 'EEEEEE', { locale: fi })}
                    </div>
                    <div 
                      className={`text-lg cursor-pointer hover:text-reportronic-500 ${
                        isToday(day) 
                          ? 'text-reportronic-500 font-bold' 
                          : isHoliday 
                            ? 'text-red-600' 
                            : ''
                      }`}
                      onClick={() => handleDateClick(day)}
                    >
                      {format(day, 'd')}
                    </div>
                    
                    {holidayName && (
                      <div className="text-xs text-red-600 mt-1 mb-1">
                        {holidayName}
                      </div>
                    )}
                    
                    <div className="mt-2 mb-2">
                      {dailyHours[format(day, 'yyyy-MM-dd')] !== undefined ? (
                        <Badge className={`${isHoliday ? 'bg-red-500' : 'bg-reportronic-500'}`}>
                          {dailyHours[format(day, 'yyyy-MM-dd')].toFixed(2)} h
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={`${isHoliday ? 'text-red-400 border-red-300' : 'text-gray-400'}`}>
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
                        onClick={() => handleEdit(entry)}
                      >
                        <div className="font-medium truncate">
                          {entry.hours} h - {getProjectName(entry.project_id)}
                        </div>
                        <div className="truncate text-gray-600">
                          {entry.description?.substring(0, 20)}{entry.description && entry.description.length > 20 ? '...' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8">
            <div 
              className="flex justify-between items-center pb-3 cursor-pointer" 
              onClick={() => setExpandedWeek(!expandedWeek)}
            >
              <h3 className="font-medium text-lg">
                {expandedWeek ? 
                  <ChevronUp className="h-4 w-4 inline mr-2 text-reportronic-500" /> : 
                  <ChevronDown className="h-4 w-4 inline mr-2 text-reportronic-500" />}
                {t('weekly_entries')}
              </h3>
              <div className="text-reportronic-600 font-medium">
                {totalWeekHours.toFixed(1)}h
              </div>
            </div>
            
            {expandedWeek && (
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('client')}</TableHead>
                      <TableHead>{t('project')}</TableHead>
                      <TableHead>{t('description')}</TableHead>
                      <TableHead className="text-right">{t('hours')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead className="text-center">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.length > 0 ? (
                      timeEntries.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-gray-100">
                          <TableCell>{format(parseISO(entry.date), 'EEE d.M', { locale: fi })}</TableCell>
                          <TableCell>{getClientName(entry.project_id)}</TableCell>
                          <TableCell>{getProjectName(entry.project_id)}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{entry.description || "-"}</TableCell>
                          <TableCell className="text-right">{Number(entry.hours).toFixed(1)}h</TableCell>
                          <TableCell>
                            {entry.status === 'draft' && <Badge variant="outline" className="text-gray-600 border-gray-300">{t('draft')}</Badge>}
                            {entry.status === 'pending' && <Badge variant="outline" className="text-orange-600 border-orange-300">{t('pending_approval')}</Badge>}
                            {entry.status === 'approved' && <Badge variant="outline" className="text-green-600 border-green-300">{t('approved')}</Badge>}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Avaa valikko</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(entry)}>
                                  Muokkaa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopy(entry)}>
                                  Kopioi
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(entry.id)} className="text-red-600 focus:text-red-600">
                                  Poista
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          {t('no_time_entries')}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-gray-100">
                      <TableCell colSpan={4} className="text-right font-medium">{t('total')}:</TableCell>
                      <TableCell className="text-right font-medium text-reportronic-600">{totalWeekHours.toFixed(1)}h</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
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
              userId={activeUserId}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowTimeEntry(false)}>
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg">
          <SheetHeader>
            <SheetTitle>Muokkaa aikakirjausta</SheetTitle>
            <SheetDescription>
              Muokkaa aikakirjauksen tietoja alla olevassa lomakkeessa.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            {currentEntry && (
              <TimeEntry 
                initialDate={currentEntry.date}
                initialHours={String(currentEntry.hours)}
                initialDescription={currentEntry.description || ''}
                initialProjectId={currentEntry.project_id}
                initialStatus={currentEntry.status}
                entryId={currentEntry.id}
                onEntrySaved={handleEntrySaved}
                userId={activeUserId}
              />
            )}
          </div>
          
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Peruuta</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default WeeklyView;
