
import { useState, useEffect } from "react";
import { useLanguage } from '@/context/LanguageContext';
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const ProjectSelect = ({ value, onChange }: ProjectSelectProps) => {
  const { t } = useLanguage();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  
  // Fetch clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name');
      
      if (error) {
        console.error('Error fetching clients:', error);
        toast.error(t('error_fetching_clients'));
        return [];
      }
      
      return data;
    }
  });

  // Fetch projects for selected client
  const { data: clientProjects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['client-projects', selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', selectedClient);
      
      if (error) {
        console.error('Error fetching client projects:', error);
        toast.error(t('error_fetching_projects'));
        return [];
      }
      
      return data;
    },
    enabled: !!selectedClient
  });

  // Fetch selected project details
  const { data: selectedProject, isLoading: isLoadingSelectedProject } = useQuery({
    queryKey: ['project', value],
    queryFn: async () => {
      if (!value || value === 'all') return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client_id')
        .eq('id', value)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching selected project:', error);
        toast.error(t('error_fetching_project_details'));
        return null;
      }
      
      return data;
    },
    enabled: !!value && value !== 'all'
  });

  // Set selected client when project is selected
  useEffect(() => {
    if (selectedProject && !selectedClient) {
      setSelectedClient(selectedProject.client_id);
    }
  }, [selectedProject, selectedClient]);

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    onChange(''); // Clear project selection when client changes
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client">{t('client')}</Label>
        <Select 
          value={selectedClient || ''} 
          onValueChange={handleClientChange}
          disabled={isLoadingClients}
        >
          <SelectTrigger id="client" className="w-full">
            <SelectValue placeholder={t('select_client')} />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClient && (
        <div className="space-y-2">
          <Label htmlFor="project">{t('project')}</Label>
          <Select 
            value={value} 
            onValueChange={onChange}
            disabled={isLoadingProjects}
          >
            <SelectTrigger id="project" className="w-full">
              <SelectValue placeholder={t('select_project')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_projects')}</SelectItem>
              {clientProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(isLoadingClients || isLoadingProjects) && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default ProjectSelect;
