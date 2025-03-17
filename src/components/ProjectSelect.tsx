
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
import { clients } from "@/data/ClientsData";

interface ProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const ProjectSelect = ({ value, onChange }: ProjectSelectProps) => {
  const { t } = useLanguage();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  
  // Find the selected project's name to display
  const getProjectName = () => {
    if (!value) return t('select_project');
    for (const client of clients) {
      const project = client.projects.find((p) => p.id === value);
      if (project) return project.name;
    }
    return t('select_project');
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
  };

  const handleProjectSelect = (projectId: string) => {
    // Ensure we're providing a valid UUID for the project ID
    // For testing, we'll format the project IDs as UUIDs
    // In a real application, these would come from your database
    const formattedProjectId = formatAsUUID(projectId);
    onChange(formattedProjectId);
    setOpen(false);
    setSelectedClient(null);
  };

  // This function converts simple numeric IDs to UUID format
  // Note: This is a temporary solution - in production you'd use real UUIDs from database
  const formatAsUUID = (id: string): string => {
    // Create a UUID from the project ID
    // This is a simplified version for testing purposes
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x is hex digit and y is 8, 9, A, or B
    const idNum = parseInt(id, 10);
    return `00000000-0000-4000-a000-${idNum.toString().padStart(12, '0')}`;
  };

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
        
        {!selectedClient ? (
          // Show client selection
          <div className="grid gap-2 py-4">
            {clients.map((client) => (
              <Button
                key={client.id}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => handleClientSelect(client.id)}
              >
                {client.name}
              </Button>
            ))}
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
            
            {clients
              .find((c) => c.id === selectedClient)
              ?.projects.map((project) => (
                <Button
                  key={project.id}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => handleProjectSelect(project.id)}
                >
                  {project.name}
                </Button>
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSelect;
