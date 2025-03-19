
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock, BarChart3, CheckCircle2, Clock4 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, startOfToday, startOfWeek, endOfWeek } from 'date-fns';
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

const TodayEntries = ({ onEntrySaved, onEntryDeleted }: { 
  onEntrySaved?: (entry: any) => void;
  onEntryDeleted?: () => void;
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntryItem[]>([]);
  const [weeklyAverage, setWeeklyAverage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntryItem | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const today = startOfToday();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Check if the current user is an admin
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
        project: entry.projects?.name || 'Unknown Project',
        client: entry.projects?.clients?.name || 'Unknown Client',
        project_id: entry.project_id,
        status: entry.status,
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

  const fetchWeeklyAverage = async () => {
    if (!user?.id) return;
    
    try {
      const weekStart = format(startOfWeek(today), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(today), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('hours, date')
        .eq('user_id', user.id)
        .gte('date', weekStart)
        .lte('date', weekEnd);
        
      if (error) {
        console.error('Error fetching weekly data:', error);
        return;
      }
      
      // Group entries by date
      const entriesByDate = new Map();
      data.forEach(entry => {
        const date = entry.date;
        if (!entriesByDate.has(date)) {
          entriesByDate.set(date, []);
        }
        entriesByDate.get(date).push(entry);
      });
      
      // Calculate daily totals
      const dailyTotals = Array.from(entriesByDate.entries()).map(([date, entries]) => {
        const total = entries.reduce((sum: number, entry: any) => sum + entry.hours, 0);
        return { date, total };
      });
      
      // Calculate average
      const totalDays = dailyTotals.length || 1; // Avoid division by zero
      const totalHours = dailyTotals.reduce((sum, day) => sum + day.total, 0);
      const average = totalHours / totalDays;
      
      setWeeklyAverage(average);
    } catch (error) {
      console.error('Exception fetching weekly average:', error);
    }
  };

  // Fixed: Use useEffect instead of useState to load data on component mount
  useEffect(() => {
    fetchTodayEntries();
    fetchWeeklyAverage();
    checkUserRole();
  }, [user]); // Added user as a dependency

  const handleEdit = (entry: TimeEntryItem) => {
    // Don't allow editing approved entries
    if (entry.status === 'approved' && !isAdmin) {
      toast.info(t('cannot_edit_approved_entry'));
      return;
    }
    
    setCurrentEntry(entry);
    setEditDialogOpen(true);
  };

  const handleDelete = async (entryId: string, status: string) => {
    // Don't allow deleting approved entries
    if (status === 'approved' && !isAdmin) {
      toast.info(t('cannot_delete_approved_entry'));
      return;
    }
    
    if (!confirm(t('confirm_delete'))) return;

    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Error deleting entry:', error);
        toast.error(t('error_deleting_entry'));
        return;
      }

      toast.success(t('entry_deleted'));
      fetchTodayEntries();
      fetchWeeklyAverage();
      
      if (onEntryDeleted) {
        onEntryDeleted();
      }
    } catch (error) {
      console.error('Exception deleting entry:', error);
      toast.error(t('error_deleting_entry'));
    }
  };

  const handleEntrySaved = (entry: any) => {
    fetchTodayEntries();
    fetchWeeklyAverage();
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
        toast.error(t('error_submitting_for_approval'));
        return;
      }

      toast.success(t('entry_submitted_for_approval'));
      fetchTodayEntries();
    } catch (error) {
      console.error('Exception submitting for approval:', error);
      toast.error(t('error_submitting_for_approval'));
    }
  };

  const handleApproveEntry = async (entryId: string) => {
    if (!isAdmin) {
      toast.error(t('only_admins_can_approve'));
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
        toast.error(t('error_approving_entry'));
        return;
      }

      toast.success(t('entry_approved'));
      fetchTodayEntries();
    } catch (error) {
      console.error('Exception approving entry:', error);
      toast.error(t('error_approving_entry'));
    }
  };

  // Calculate total hours for today
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return <Badge variant="outline" className="text-gray-600 border-gray-300">{t('draft')}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">{t('pending_approval')}</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300">{t('approved')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
            <Clock className="mr-2 h-4 w-4 text-reportronic-500" />
            {t('today_entries')}
          </CardTitle>
          <div className="text-lg font-bold">{totalHours.toFixed(1)}h</div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">{t('loading')}...</div>
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
                      
                      {entry.status === 'draft' && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-blue-600" 
                          onClick={() => handleSubmitForApproval(entry.id)}
                          title={t('submit_for_approval')}
                        >
                          <Clock4 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {isAdmin && entry.status === 'pending' && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-green-600" 
                          onClick={() => handleApproveEntry(entry.id)}
                          title={t('approve')}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {(entry.status !== 'approved' || isAdmin) && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7" 
                          onClick={() => handleEdit(entry)}
                          title={t('edit')}
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
                          title={t('delete')}
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
              {t('no_entries_today')}
            </div>
          )}
          
          <div className="border-t p-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm font-medium text-gray-600">
                <BarChart3 className="mr-2 h-4 w-4 text-reportronic-500" />
                {t('weekly_average')}
              </div>
              <div className="text-reportronic-700 font-medium">{weeklyAverage.toFixed(1)}h</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('edit_time_entry')}</DialogTitle>
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
