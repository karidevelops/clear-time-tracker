
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, startOfToday } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TimeEntry from './TimeEntry';
import { toast } from 'sonner';

interface TimeEntryItem {
  id: string;
  date: string;
  hours: number;
  description: string;
  project: string;
  client: string;
  project_id: string;
}

const TodayEntries = ({ onEntrySaved, onEntryDeleted }: { 
  onEntrySaved?: (entry: any) => void;
  onEntryDeleted?: () => void;
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntryItem | null>(null);
  const today = startOfToday();
  const todayStr = format(today, 'yyyy-MM-dd');

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
        project_id: entry.project_id
      }));

      setEntries(mappedEntries);
    } catch (error) {
      console.error('Exception fetching today entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fixed: Use useEffect instead of useState to load data on component mount
  useEffect(() => {
    fetchTodayEntries();
  }, [user]); // Added user as a dependency

  const handleEdit = (entry: TimeEntryItem) => {
    setCurrentEntry(entry);
    setEditDialogOpen(true);
  };

  const handleDelete = async (entryId: string) => {
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
    setEditDialogOpen(false);
    
    if (onEntrySaved) {
      onEntrySaved(entry);
    }
  };

  // Calculate total hours for today
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

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
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-reportronic-700 font-medium">{entry.hours}h</div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7" 
                        onClick={() => handleEdit(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-red-600" 
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
              onEntrySaved={handleEntrySaved}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TodayEntries;
