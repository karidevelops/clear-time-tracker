
import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
    onChange(projectId);
    setOpen(false);
    setSelectedClient(null);
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
