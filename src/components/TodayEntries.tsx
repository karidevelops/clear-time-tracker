
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock, BarChart3, CheckCircle2, Copy } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, getWeek, getWeekOfMonth } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TimeEntry from './TimeEntry';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface TimeEntryItem {
  id: string;
  date: string;
  hours: number;
  description: string;
  project: string;
  client: string;
  project_id: string;
  status: 'draft' | 'pending' | 'approved';
  approved_by?: string;
  approved_at?: string;
}

interface MonthlyHoursData {
  date: string;
  hours: number;
}

interface WeeklyHoursData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  hours: number;
  entries: {
    date: string;
    hours: number;
  }[];
}

interface TodayEntriesProps {
  onEntrySaved?: (entry: any) => void;
  onEntryDeleted?: () => void;
  inDialog?: boolean;
}

const TodayEntries = ({ onEntrySaved, onEntryDeleted, inDialog = false }: TodayEntriesProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntryItem[]>([]);
  const [weeklyAverage, setWeeklyAverage] = useState<number>(0);
  const [monthlyHours, setMonthlyHours] = useState<MonthlyHoursData[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHoursData[]>([]);
  const [totalMonthlyHours, setTotalMonthlyHours] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntryItem | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const today = startOfToday();
  const todayStr = format(today, 'yyyy-MM-dd');

  const checkUserRole = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }
      
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Exception checking admin status:', error);
    }
  };

  const fetchTodayEntries = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          id,
          date,
          hours,
          description,
          project_id,
          status,
          approved_by,
          approved_at,
          projects (
            name,
            client_id,
            clients (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('date', todayStr)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching today entries:', error);
        return;
      }

      const mappedEntries = data.map(entry => ({
        id: entry.id,
        date: entry.date,
        hours: entry.hours,
        description: entry.description || '',
        project: entry.projects?.name || 'Tuntematon projekti',
        client: entry.projects?.clients?.name || 'Tuntematon asiakas',
        project_id: entry.project_id,
        status: entry.status as 'draft' | 'pending' | 'approved',
        approved_by: entry.approved_by,
        approved_at: entry.approved_at
      }));

      setEntries(mappedEntries);
    } catch (error) {
      console.error('Exception fetching today entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyHours = async () => {
    if (!user?.id) return;
    
    try {
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      
      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('hours, date')
        .eq('user_id', user.id)
        .gte('date', monthStartStr)
        .lte('date', monthEndStr)
        .order('date', { ascending: true });
        
      if (error) {
        console.error('Error fetching monthly data:', error);
        return;
      }
      
      const entriesByDate = new Map<string, number>();
      
      data.forEach(entry => {
        const dateKey = entry.date;
        const currentHours = entriesByDate.get(dateKey) || 0;
        entriesByDate.set(dateKey, currentHours + entry.hours);
      });
      
      const hoursData: MonthlyHoursData[] = Array.from(entriesByDate.entries()).map(
        ([date, hours]) => ({ date, hours })
      );
      
      const entriesByWeek = new Map<number, WeeklyHoursData>();
      
      hoursData.forEach(entry => {
        const entryDate = parseISO(entry.date);
        const weekStart = startOfWeek(entryDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(entryDate, { weekStartsOn: 1 });
        const weekNumber = getWeekOfMonth(entryDate, { weekStartsOn: 1 });
        
        if (!entriesByWeek.has(weekNumber)) {
          entriesByWeek.set(weekNumber, {
            weekNumber,
            startDate: format(weekStart, 'yyyy-MM-dd'),
            endDate: format(weekEnd, 'yyyy-MM-dd'),
            hours: 0,
            entries: []
          });
        }
        
        const weekData = entriesByWeek.get(weekNumber)!;
        weekData.hours += entry.hours;
        weekData.entries.push({
          date: entry.date,
          hours: entry.hours
        });
      });
      
      const weeksData: WeeklyHoursData[] = Array.from(entriesByWeek.values()).sort(
        (a, b) => a.weekNumber - b.weekNumber
      );
      
      const total = hoursData.reduce((sum, day) => sum + day.hours, 0);
      
      setMonthlyHours(hoursData);
      setWeeklyHours(weeksData);
      setTotalMonthlyHours(total);
      
      const average = total / 4;
      setWeeklyAverage(average);
      
    } catch (error) {
      console.error('Exception fetching monthly hours:', error);
    }
  };

  useEffect(() => {
    fetchTodayEntries();
    fetchMonthlyHours();
    checkUserRole();
  }, [user]);

  const handleEdit = (entry: TimeEntryItem) => {
    if (entry.status === 'approved' && !isAdmin) {
      toast.info('Et voi muokata hyväksyttyä kirjausta');
      return;
    }
    
    setCurrentEntry(entry);
    setEditDialogOpen(true);
  };

  const handleDuplicate = async (entry: TimeEntryItem) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          date: entry.date,
          hours: entry.hours,
          description: entry.description,
          project_id: entry.project_id,
          user_id: user.id,
          status: 'draft'
        })
        .select();

      if (error) {
        console.error('Error duplicating entry:', error);
        toast.error('Virhe kirjauksen kopioinnissa');
        return;
      }

      toast.success('Kirjaus kopioitu onnistuneesti');
      fetchTodayEntries();
      
      if (onEntrySaved) {
        onEntrySaved(data[0]);
      }
    } catch (error) {
      console.error('Exception duplicating entry:', error);
      toast.error('Virhe kirjauksen kopioinnissa');
    }
  };

  const handleDelete = async (entryId: string, status: string) => {
    if (status === 'approved' && !isAdmin) {
      toast.info('Et voi poistaa hyväksyttyä kirjausta');
      return;
    }
    
    if (!confirm('Haluatko varmasti poistaa tämän kirjauksen?')) return;

    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Error deleting entry:', error);
        toast.error('Virhe kirjauksen poistamisessa');
        return;
      }

      toast.success('Kirjaus poistettu onnistuneesti');
      fetchTodayEntries();
      fetchMonthlyHours();
      
      if (onEntryDeleted) {
        onEntryDeleted();
      }
    } catch (error) {
      console.error('Exception deleting entry:', error);
      toast.error('Virhe kirjauksen poistamisessa');
    }
  };

  const handleEntrySaved = (entry: any) => {
    fetchTodayEntries();
    fetchMonthlyHours();
    setEditDialogOpen(false);
    
    if (onEntrySaved) {
      onEntrySaved(entry);
    }
  };

  const handleSubmitForApproval = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ status: 'pending' })
        .eq('id', entryId);

      if (error) {
        console.error('Error submitting for approval:', error);
        toast.error('Virhe hyväksyntään lähettämisessä');
        return;
      }

      toast.success('Kirjaus lähetetty hyväksyttäväksi');
      fetchTodayEntries();
    } catch (error) {
      console.error('Exception submitting for approval:', error);
      toast.error('Virhe hyväksyntään lähettämisessä');
    }
  };

  const handleApproveEntry = async (entryId: string) => {
    if (!isAdmin) {
      toast.error('Vain järjestelmänvalvojat voivat hyväksyä kirjauksia');
      return;
    }

    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ 
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) {
        console.error('Error approving entry:', error);
        toast.error('Virhe kirjauksen hyväksymisessä');
        return;
      }

      toast.success('Kirjaus hyväksytty');
      fetchTodayEntries();
    } catch (error) {
      console.error('Exception approving entry:', error);
      toast.error('Virhe kirjauksen hyväksymisessä');
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return <Badge variant="outline" className="text-gray-600 border-gray-300">Luonnos</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">Hyväksyntää odottava</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300">Hyväksytty</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'dd.MM');
    } catch (e) {
      return dateStr;
    }
  };

  // For dialog mode, render a simpler version without the Card wrapper
  if (inDialog) {
    return (
      <>
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Ladataan...</div>
        ) : entries.length > 0 ? (
          <div className="divide-y max-h-[250px] overflow-y-auto border rounded-md">
            {entries.map((entry) => (
              <div key={entry.id} className="p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{entry.client}: {entry.project}</div>
                    {entry.description && (
                      <div className="text-sm text-gray-700 mt-1">{entry.description}</div>
                    )}
                    <div className="mt-2 flex items-center space-x-2">
                      {renderStatusBadge(entry.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-reportronic-700 font-medium">{entry.hours}h</div>
                    
                    {isAdmin && entry.status === 'pending' && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-green-600" 
                        onClick={() => handleApproveEntry(entry.id)}
                        title="Hyväksy"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7" 
                      onClick={() => handleDuplicate(entry)}
                      title="Kopioi"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    {(entry.status !== 'approved' || isAdmin) && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7" 
                        onClick={() => handleEdit(entry)}
                        title="Muokkaa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {(entry.status !== 'approved' || isAdmin) && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-red-600" 
                        onClick={() => handleDelete(entry.id, entry.status)}
                        title="Poista"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 border rounded-md">
            Ei kirjauksia tänään
          </div>
        )}
        
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Muokkaa aikakirjausta</DialogTitle>
            </DialogHeader>
            {currentEntry && (
              <TimeEntry 
                initialDate={currentEntry.date}
                initialHours={currentEntry.hours.toString()}
                initialDescription={currentEntry.description}
                initialProjectId={currentEntry.project_id}
                entryId={currentEntry.id}
                initialStatus={currentEntry.status}
                isAdmin={isAdmin}
                onEntrySaved={handleEntrySaved}
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Regular card view for the main page
  return (
    <>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
            <Clock className="mr-2 h-4 w-4 text-reportronic-500" />
            Tämän päivän kirjaukset
          </CardTitle>
          <div className="text-lg font-bold">{totalHours.toFixed(1)}h</div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Ladataan...</div>
          ) : entries.length > 0 ? (
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {entries.map((entry) => (
                <div key={entry.id} className="p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{entry.client}: {entry.project}</div>
                      {entry.description && (
                        <div className="text-sm text-gray-700 mt-1">{entry.description}</div>
                      )}
                      <div className="mt-2 flex items-center space-x-2">
                        {renderStatusBadge(entry.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-reportronic-700 font-medium">{entry.hours}h</div>
                      
                      {isAdmin && entry.status === 'pending' && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-green-600" 
                          onClick={() => handleApproveEntry(entry.id)}
                          title="Hyväksy"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7" 
                        onClick={() => handleDuplicate(entry)}
                        title="Kopioi"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      {(entry.status !== 'approved' || isAdmin) && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7" 
                          onClick={() => handleEdit(entry)}
                          title="Muokkaa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {(entry.status !== 'approved' || isAdmin) && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-red-600" 
                          onClick={() => handleDelete(entry.id, entry.status)}
                          title="Poista"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Ei kirjauksia tänään
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Muokkaa aikakirjausta</DialogTitle>
          </DialogHeader>
          {currentEntry && (
            <TimeEntry 
              initialDate={currentEntry.date}
              initialHours={currentEntry.hours.toString()}
              initialDescription={currentEntry.description}
              initialProjectId={currentEntry.project_id}
              entryId={currentEntry.id}
              initialStatus={currentEntry.status}
              isAdmin={isAdmin}
              onEntrySaved={handleEntrySaved}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TodayEntries;
