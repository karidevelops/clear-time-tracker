import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { format, parseISO, getWeek, startOfWeek, endOfWeek, isSameDay, getMonth } from 'date-fns';
import { fi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { TimeEntry } from '@/types/timeEntry';
import { supabase } from '@/integrations/supabase/client';
import { getAllProjects, getProjectById } from '@/data/ClientsData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import TimeEntryForm from '@/components/TimeEntry';

interface WeeklyTimeEntriesProps {
  timeEntries: TimeEntry[];
  title?: string;
}

interface WeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  entries: TimeEntry[];
  totalHours: number;
  isExpanded: boolean;
}

interface ProjectInfo {
  [key: string]: {
    name: string;
    clientName: string;
  };
}

const WeeklyTimeEntries: React.FC<WeeklyTimeEntriesProps> = ({
  timeEntries,
  title = 'Viikottaiset tunnit' // Default title in Finnish
}) => {
  const {
    t
  } = useLanguage();
  const {
    toast
  } = useToast();
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
  const [totalMonthHours, setTotalMonthHours] = useState(0);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({});
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentMonthName = format(new Date(), 'LLLL', { locale: fi });
  const capitalizedMonthName = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  useEffect(() => {
    fetchProjectInfo();
  }, []);

  const fetchProjectInfo = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('projects').select(`
        id,
        name,
        client_id,
        clients (
          name
        )
      `);
      if (!error && data && data.length > 0) {
        const projectMap: ProjectInfo = {};
        data.forEach(project => {
          projectMap[project.id] = {
            name: project.name,
            clientName: project.clients?.name || 'Unknown Client'
          };
        });
        setProjectInfo(projectMap);
      } else {
        const projects = getAllProjects();
        const projectMap: ProjectInfo = {};
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

  const handleEdit = (entryId: string) => {
    console.log('Edit entry:', entryId);
    const entry = findEntryById(entryId);
    if (entry) {
      setCurrentEntry(entry);
      setIsEditSheetOpen(true);
    }
  };

  const handleDelete = async (entryId: string) => {
    const entry = findEntryById(entryId);
    if (entry) {
      setCurrentEntry(entry);
      try {
        setIsLoading(true);
        const {
          error
        } = await supabase.from('time_entries').delete().eq('id', entryId);
        if (error) throw error;
        removeEntryFromState(entryId);
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
        setCurrentEntry(null);
      }
    }
  };

  const handleCopy = (entryId: string) => {
    console.log('Copy entry:', entryId);
    const entry = findEntryById(entryId);
    if (entry) {
      const newEntry: Omit<TimeEntry, 'id'> = {
        date: entry.date,
        description: entry.description,
        hours: entry.hours,
        project_id: entry.project_id,
        user_id: entry.user_id,
        status: 'draft'
      };
      createCopy(newEntry);
    }
  };

  const createCopy = async (entryData: Omit<TimeEntry, 'id'>) => {
    try {
      setIsLoading(true);
      const {
        data,
        error
      } = await supabase.from('time_entries').insert(entryData).select();
      if (error) throw error;
      if (data && data.length > 0) {
        addEntryToState(data[0] as TimeEntry);
        toast({
          title: "Kopio luotu",
          description: "Aikakirjauksesta on luotu kopio onnistuneesti.",
          variant: "default"
        });
      }
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

  const findEntryById = (entryId: string): TimeEntry | null => {
    for (const week of weeklyData) {
      const entry = week.entries.find(e => e.id === entryId);
      if (entry) return entry;
    }
    return null;
  };

  const removeEntryFromState = (entryId: string) => {
    setWeeklyData(prevData => {
      const newData = [...prevData];
      for (let i = 0; i < newData.length; i++) {
        const weekEntries = [...newData[i].entries];
        const entryIndex = weekEntries.findIndex(e => e.id === entryId);
        if (entryIndex !== -1) {
          weekEntries.splice(entryIndex, 1);
          const totalHours = weekEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
          newData[i] = {
            ...newData[i],
            entries: weekEntries,
            totalHours
          };
          if (weekEntries.length === 0) {
            newData.splice(i, 1);
          }
          break;
        }
      }
      return newData;
    });
    setTotalMonthHours(prev => {
      const deletedEntry = findEntryById(entryId);
      return deletedEntry ? prev - Number(deletedEntry.hours) : prev;
    });
  };

  const addEntryToState = (newEntry: TimeEntry) => {
    setWeeklyData(prevData => {
      const newData = [...prevData];
      const entryDate = parseISO(newEntry.date);
      const weekNumber = getWeek(entryDate, {
        weekStartsOn: 1
      });
      let weekIndex = newData.findIndex(week => week.weekNumber === weekNumber);
      if (weekIndex !== -1) {
        const week = newData[weekIndex];
        const newEntries = [...week.entries, newEntry].sort((a, b) => a.date.localeCompare(b.date));
        const newTotalHours = week.totalHours + Number(newEntry.hours);
        newData[weekIndex] = {
          ...week,
          entries: newEntries,
          totalHours: newTotalHours
        };
      } else {
        const weekStart = startOfWeek(entryDate, {
          weekStartsOn: 1
        });
        const weekEnd = endOfWeek(entryDate, {
          weekStartsOn: 1
        });
        newData.push({
          weekNumber,
          startDate: weekStart,
          endDate: weekEnd,
          entries: [newEntry],
          totalHours: Number(newEntry.hours),
          isExpanded: false
        });
        newData.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
      }
      return newData;
    });
    setTotalMonthHours(prev => prev + Number(newEntry.hours));
  };

  useEffect(() => {
    if (!timeEntries || timeEntries.length === 0) return;
    const entriesByWeek = new Map<number, TimeEntry[]>();
    timeEntries.forEach(entry => {
      if (!entry.date) return;
      const entryDate = parseISO(entry.date);
      const weekStart = startOfWeek(entryDate, {
        weekStartsOn: 1
      });
      const weekNumber = getWeek(entryDate, {
        weekStartsOn: 1
      });
      if (!entriesByWeek.has(weekNumber)) {
        entriesByWeek.set(weekNumber, []);
      }
      entriesByWeek.get(weekNumber)?.push(entry);
    });
    const weeks: WeekData[] = [];
    entriesByWeek.forEach((entries, weekNumber) => {
      if (entries.length === 0) return;
      const firstEntry = entries[0];
      const firstDate = parseISO(firstEntry.date);
      const weekStart = startOfWeek(firstDate, {
        weekStartsOn: 1
      });
      const weekEnd = endOfWeek(firstDate, {
        weekStartsOn: 1
      });
      const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
      weeks.push({
        weekNumber,
        startDate: weekStart,
        endDate: weekEnd,
        entries: entries.sort((a, b) => a.date.localeCompare(b.date)),
        totalHours,
        isExpanded: false
      });
    });
    weeks.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    const totalHours = weeks.reduce((sum, week) => sum + week.totalHours, 0);
    setWeeklyData(weeks);
    setTotalMonthHours(totalHours);
  }, [timeEntries]);

  const toggleWeekExpanded = (weekIndex: number) => {
    setWeeklyData(prevData => prevData.map((week, index) => index === weekIndex ? {
      ...week,
      isExpanded: !week.isExpanded
    } : week));
  };

  const formatWeekRange = (start: Date, end: Date) => {
    return `${format(start, 'd.M')} - ${format(end, 'd.M.yyyy')}`;
  };

  const handleEntrySaved = (updatedEntry: TimeEntry) => {
    setIsEditSheetOpen(false);
    setWeeklyData(prevData => {
      const newData = [...prevData];
      for (let i = 0; i < newData.length; i++) {
        const weekEntries = [...newData[i].entries];
        const entryIndex = weekEntries.findIndex(e => e.id === updatedEntry.id);
        if (entryIndex !== -1) {
          weekEntries[entryIndex] = updatedEntry;
          const totalHours = weekEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
          newData[i] = {
            ...newData[i],
            entries: weekEntries,
            totalHours
          };
          break;
        }
      }
      return newData;
    });
    toast({
      title: "Kirjaus päivitetty",
      description: "Aikakirjaus on päivitetty onnistuneesti.",
      variant: "default"
    });
    setCurrentEntry(null);
  };

  if (!weeklyData || weeklyData.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">Ei aikakirjauksia</p>
        </CardContent>
      </Card>;
  }

  return <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{capitalizedMonthName}</CardTitle>
            <div className="text-sm font-medium">
              Yhteensä: <span className="text-reportronic-600">{totalMonthHours.toFixed(1)}h</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {weeklyData.map((week, weekIndex) => <div key={`week-${week.weekNumber}`} className="py-2">
                <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleWeekExpanded(weekIndex)}>
                  <div className="flex items-center">
                    {week.isExpanded ? <ChevronUp className="h-4 w-4 mr-2 text-reportronic-500" /> : <ChevronDown className="h-4 w-4 mr-2 text-reportronic-500" />}
                    <div>
                      <span className="font-medium">Viikko {week.weekNumber}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {formatWeekRange(week.startDate, week.endDate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-reportronic-600 font-medium">
                    {week.totalHours.toFixed(1)}h
                  </div>
                </div>
                
                {week.isExpanded && <div className="px-4 pb-4 pt-2">
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-3 text-left font-medium text-gray-500">Päivämäärä</th>
                            <th className="py-2 px-3 text-left font-medium text-gray-500">Asiakas</th>
                            <th className="py-2 px-3 text-left font-medium text-gray-500">Projekti</th>
                            <th className="py-2 px-3 text-left font-medium text-gray-500">Kuvaus</th>
                            <th className="py-2 px-3 text-right font-medium text-gray-500">Tunnit</th>
                            <th className="py-2 px-3 text-center font-medium text-gray-500">Toiminnot</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {week.entries.map(entry => <tr key={entry.id} className="hover:bg-gray-100">
                              <td className="py-2 px-3">{format(parseISO(entry.date), 'EEE d.M', {
                          locale: fi
                        })}</td>
                              <td className="py-2 px-3">{getClientName(entry.project_id)}</td>
                              <td className="py-2 px-3">{getProjectName(entry.project_id)}</td>
                              <td className="py-2 px-3">{entry.description || "-"}</td>
                              <td className="py-2 px-3 text-right">{Number(entry.hours).toFixed(1)}h</td>
                              <td className="py-2 px-3 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Avaa valikko</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(entry.id)}>
                                      Muokkaa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopy(entry.id)}>
                                      Kopioi
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(entry.id)} className="text-red-600 focus:text-red-600">
                                      Poista
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>)}
                          <tr className="bg-gray-100">
                            <td colSpan={5} className="py-2 px-3 text-right font-medium">Yhteensä:</td>
                            <td className="py-2 px-3 text-right font-medium text-reportronic-600">{week.totalHours.toFixed(1)}h</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>}
              </div>)}
          </div>
        </CardContent>
      </Card>

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg">
          <SheetHeader>
            <SheetTitle>Muokkaa aikakirjausta</SheetTitle>
            <SheetDescription>
              Muokkaa aikakirjauksen tietoja alla olevassa lomakkeessa.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            {currentEntry && <TimeEntryForm initialDate={currentEntry.date} initialHours={String(currentEntry.hours)} initialDescription={currentEntry.description || ''} initialProjectId={currentEntry.project_id} initialStatus={currentEntry.status} entryId={currentEntry.id} onEntrySaved={handleEntrySaved} />}
          </div>
          
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Peruuta</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>;
};

export default WeeklyTimeEntries;
