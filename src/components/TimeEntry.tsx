
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Save } from 'lucide-react';
import ProjectSelect from './ProjectSelect';
import { toast } from 'sonner';

const TimeEntry = () => {
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [hours, setHours] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [project, setProject] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hours || !description || !project) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // In a real app, this would send data to an API
    console.log({
      date,
      hours: parseFloat(hours),
      description,
      project
    });
    
    toast.success('Time entry saved successfully!');
    
    // Reset form
    setHours('');
    setDescription('');
  };

  return (
    <Card>
      <CardHeader className="bg-reportronic-50 border-b">
        <CardTitle className="flex items-center text-reportronic-800">
          <Clock className="mr-2 h-5 w-5 text-reportronic-600" />
          Log Time
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-gray-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
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
            <Label htmlFor="project">Project</Label>
            <ProjectSelect 
              value={project} 
              onChange={setProject} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What did you work on?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-gray-300 resize-none"
            />
          </div>
        
          <Button 
            type="submit" 
            className="w-full md:w-auto bg-reportronic-600 hover:bg-reportronic-700"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Time Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TimeEntry;
