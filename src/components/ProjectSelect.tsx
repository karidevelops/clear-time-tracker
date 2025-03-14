
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

// Mock project data that would come from an API in a real application
const projects = [
  { id: "1", name: "Website Development" },
  { id: "2", name: "Mobile App" },
  { id: "3", name: "Backend API" },
  { id: "4", name: "UI/UX Design" },
  { id: "5", name: "Quality Assurance" },
  { id: "6", name: "Documentation" },
];

interface ProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const ProjectSelect = ({ value, onChange }: ProjectSelectProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between border-gray-300 bg-white text-left font-normal"
        >
          {value
            ? projects.find((project) => project.id === value)?.name
            : "Select project..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandEmpty>No projects found.</CommandEmpty>
          <CommandGroup>
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={project.name}
                onSelect={() => {
                  onChange(project.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === project.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {project.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProjectSelect;
