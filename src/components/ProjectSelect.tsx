
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from '@/context/LanguageContext';
import { clients } from "@/data/ClientsData";

interface ProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const ProjectSelect = ({ value, onChange }: ProjectSelectProps) => {
  const { t } = useLanguage();
  
  return (
    <Select
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-full border-gray-300 bg-white text-left font-normal">
        <SelectValue placeholder={t('select_project')} />
      </SelectTrigger>
      <SelectContent>
        {clients.map((client) => (
          <SelectGroup key={client.id}>
            <SelectLabel>{client.name}</SelectLabel>
            {client.projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProjectSelect;
