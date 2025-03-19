
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Clock4, CheckCircle2 } from 'lucide-react';
import ProjectSelect from './ProjectSelect';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimeEntryProps {
  initialDate?: string;
  initialHours?: string;
  initialDescription?: string;
  initialProjectId?: string;
  initialStatus?: 'draft' | 'pending' | 'approved';
  entryId?: string;
  isAdmin?: boolean;
  onEntrySaved?: (entryData: any) => void;
  userId?: string; // Add the userId property
}

const TimeEntry = ({ 
  initialDate, 
  initialHours = '', 
  initialDescription = '', 
  initialProjectId = '',
  initialStatus = 'draft',
  entryId,
  isAdmin = false,
  onEntrySaved,
  userId
}: TimeEntryProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [hours, setHours] = useState<string>(initialHours);
  const [description, setDescription] = useState<string>(initialDescription);
  const [project, setProject] = useState<string>(initialProjectId);
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved'>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const isEditing = !!entryId;

  useEffect(() => {
    if (initialDate) setDate(initialDate);
    if (initialHours) setHours(initialHours);
    if (initialDescription) setDescription(initialDescription);
    if (initialProjectId) setProject(initialProjectId);
    if (initialStatus) setStatus(initialStatus);
  }, [initialDate, initialHours, initialDescription, initialProjectId, initialStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hours || !description || !project) {
      toast.error(t('fill_all_required_fields'));
      return;
    }
    
    if (!user && !userId) {
      toast.error(t('login_required'));
      navigate('/auth');
      return;
    }
    
    const entryData = {
      date,
      hours: parseFloat(hours),
      description,
      project_id: project,
      user_id: userId || user?.id,
      status
    };
    
    setIsLoading(true);
    
    try {
      console.log(isEditing ? "Updating time entry:" : "Saving time entry:", entryData);
      
      let data, error;

      if (isEditing && entryId) {
        const response = await supabase
          .from('time_entries')
          .update(entryData)
          .eq('id', entryId)
          .select();

        data = response.data;
        error = response.error;
      } else {
        const response = await supabase
          .from('time_entries')
          .insert(entryData)
          .select();

        data = response.data;
        error = response.error;
      }
      
      if (error) {
        console.error('Error saving time entry:', error);
        
        if (error.code === '42P17') {
          toast.error(t('database_policy_error'));
        } else if (error.code === '23505') {
          toast.error(t('duplicate_entry_error'));
        } else if (error.code === '23503') {
          toast.error(t('foreign_key_constraint_error'));
        } else {
          toast.error(t('error_saving_time_entry'));
        }
        return;
      }
      
      console.log('Time entry saved successfully:', data);
      toast.success(isEditing ? t('time_entry_updated') : t('time_entry_saved'));
      
      if (onEntrySaved && data) {
        onEntrySaved(data[0]);
      }
      
      if (!isEditing) {
        setHours('');
        setDescription('');
      }
      
    } catch (error) {
      console.error('Exception saving time entry:', error);
      toast.error(t('error_saving_time_entry'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForApproval = async (e: React.MouseEvent) => {
    e.preventDefault();
    setStatus('pending');
    
    const event = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(event);
  };

  const handleApprove = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error(t('only_admins_can_approve'));
      return;
    }
    
    setStatus('approved');
    
    const event = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(event);
  };

  const handleSubmitMonthEntries = async () => {
    if (!user) {
      toast.error(t('login_required'));
      return;
    }

    setIsLoading(true);
    try {
      const currentDate = new Date(date);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('time_entries')
        .update({ status: 'pending' })
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .gte('date', startDateStr)
        .lte('date', endDateStr);
        
      if (error) {
        console.error('Error submitting month entries:', error);
        toast.error(t('error_submitting_entries'));
        return;
      }
      
      toast.success(t('month_entries_submitted'));
      
      if (status === 'draft') {
        setStatus('pending');
        
        if (onEntrySaved) {
          const updatedEntry = {
            id: entryId,
            date,
            hours: parseFloat(hours),
            description,
            project_id: project,
            user_id: user?.id,
            status: 'pending'
          };
          onEntrySaved(updatedEntry);
        }
      }
    } catch (error) {
      console.error('Exception submitting month entries:', error);
      toast.error(t('error_submitting_entries'));
    } finally {
      setIsLoading(false);
      setShowSubmitDialog(false);
    }
  };

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

  const canEdit = isAdmin || status !== 'approved';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isEditing && (
          <div className="md:col-span-2 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{t('status')}:</span>
              {renderStatusBadge(status)}
            </div>
            {isAdmin && (
              <div className="space-x-2">
                <Select 
                  value={status} 
                  onValueChange={(value: any) => setStatus(value)}
                  disabled={!isAdmin}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('select_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('draft')}</SelectItem>
                    <SelectItem value="pending">{t('pending_approval')}</SelectItem>
                    <SelectItem value="approved">{t('approved')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="date">{t('date')}</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-gray-300"
            disabled={!canEdit}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hours">{t('hours')}</Label>
          <Input
            id="hours"
            type="number"
            min="0.25"
            step="0.25"
            placeholder="0.00"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="border-gray-300"
            disabled={!canEdit}
          />
        </div>
      </div>
      
      <ProjectSelect 
        value={project} 
        onChange={setProject}
        disabled={!canEdit}
      />
      
      <div className="space-y-2">
        <Label htmlFor="description">{t('description')}</Label>
        <Textarea
          id="description"
          placeholder={t('what_did_you_work_on')}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border-gray-300 resize-none"
          disabled={!canEdit}
        />
      </div>
    
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button 
            type="submit" 
            className="bg-reportronic-500 hover:bg-reportronic-600 text-white"
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? t('saving') : isEditing ? t('update_time_entry') : t('save_time_entry')}
          </Button>
        )}
        
        {isAdmin && status === 'pending' && (
          <Button 
            type="button"
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50"
            disabled={isLoading}
            onClick={handleApprove}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t('approve')}
          </Button>
        )}
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('submit_month_entries')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('submit_month_entries_confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmitMonthEntries}
              disabled={isLoading}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              {isLoading ? t('submitting') : t('submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit All Month Entries button moved to the very bottom of the form */}
      {status === 'draft' && canEdit && (
        <div className="mt-10 pt-4 border-t border-gray-200 mb-2">
          <Button 
            type="button"
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50 w-full"
            disabled={isLoading}
            onClick={() => setShowSubmitDialog(true)}
          >
            <Clock4 className="mr-2 h-4 w-4" />
            Lähetä tunnit hyväksyntään
          </Button>
        </div>
      )}
    </form>
  );
};

export default TimeEntry;
