
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/context/LanguageContext';
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const ProjectSelect = ({ value, onChange }: ProjectSelectProps) => {
  const { t } = useLanguage();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  
  // Fetch clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name');
      
      if (error) {
        console.error('Error fetching clients:', error);
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
        return [];
      }
      
      return data;
    },
    enabled: !!selectedClient
  });

  // Fetch project details if value is provided
  const { data: selectedProject, isLoading: isLoadingSelectedProject } = useQuery({
    queryKey: ['project', value],
    queryFn: async () => {
      if (!value) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', value)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching selected project:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!value
  });
  
  // Get the selected project's name to display
  const getProjectName = () => {
    if (isLoadingSelectedProject) return t('loading');
    if (!value || !selectedProject) return t('select_project');
    return selectedProject.name;
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
  };

  const handleProjectSelect = (projectId: string) => {
    onChange(projectId);
    setOpen(false);
    setSelectedClient(null);
  };

  const isLoading = isLoadingClients || (!!selectedClient && isLoadingProjects);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between border-gray-300 bg-white text-left font-normal"
        >
          {getProjectName()}
          <span className="opacity-50">▼</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{selectedClient ? t('select_project') : t('select_client')}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !selectedClient ? (
          // Show client selection
          <div className="grid gap-2 py-4">
            {clients.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">{t('no_clients')}</p>
            ) : (
              clients.map((client) => (
                <Button
                  key={client.id}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => handleClientSelect(client.id)}
                >
                  {client.name}
                </Button>
              ))
            )}
          </div>
        ) : (
          // Show projects for selected client
          <div className="grid gap-2 py-4">
            <Button 
              variant="outline" 
              className="mb-2" 
              onClick={() => setSelectedClient(null)}
            >
              ← {t('back_to_clients')}
            </Button>
            
            {clientProjects.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">{t('no_projects_for_client')}</p>
            ) : (
              clientProjects.map((project) => (
                <Button
                  key={project.id}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => handleProjectSelect(project.id)}
                >
                  {project.name}
                </Button>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSelect;
