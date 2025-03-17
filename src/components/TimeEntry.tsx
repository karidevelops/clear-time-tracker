
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import ProjectSelect from './ProjectSelect';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TimeEntryProps {
  initialDate?: string;
  onEntrySaved?: (entryData: any) => void;
}

const TimeEntry = ({ initialDate, onEntrySaved }: TimeEntryProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [hours, setHours] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [project, setProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Update date when initialDate prop changes
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hours || !description || !project) {
      toast.error(t('fill_all_required_fields'));
      return;
    }
    
    if (!user) {
      toast.error(t('login_required'));
      navigate('/auth');
      return;
    }
    
    // Create entry data object
    const entryData = {
      date,
      hours: parseFloat(hours),
      description,
      project_id: project,
      user_id: user.id
    };
    
    setIsLoading(true);
    
    try {
      console.log("Saving time entry:", entryData);
      
      // Insert the time entry into Supabase
      const { data, error } = await supabase
        .from('time_entries')
        .insert(entryData)
        .select();
      
      if (error) {
        console.error('Error saving time entry:', error);
        toast.error(t('error_saving_time_entry'));
        return;
      }
      
      console.log('Time entry saved successfully:', data);
      toast.success(t('time_entry_saved'));
      
      // Call the callback if provided
      if (onEntrySaved && data) {
        onEntrySaved(data[0]);
      }
      
      // Reset form
      setHours('');
      setDescription('');
      
    } catch (error) {
      console.error('Exception saving time entry:', error);
      toast.error(t('error_saving_time_entry'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">{t('date')}</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-gray-300"
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
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="project">{t('project')}</Label>
        <ProjectSelect 
          value={project} 
          onChange={setProject} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">{t('description')}</Label>
        <Textarea
          id="description"
          placeholder={t('what_did_you_work_on')}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border-gray-300 resize-none"
        />
      </div>
    
      <Button 
        type="submit" 
        className="w-full md:w-auto bg-reportronic-500 hover:bg-reportronic-600 text-white"
        disabled={isLoading}
      >
        <Save className="mr-2 h-4 w-4" />
        {isLoading ? t('saving') : t('save_time_entry')}
      </Button>
    </form>
  );
};

export default TimeEntry;
