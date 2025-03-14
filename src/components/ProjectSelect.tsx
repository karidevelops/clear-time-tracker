
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  return (
    <Select
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-full border-gray-300 bg-white text-left font-normal">
        <SelectValue placeholder="Select project..." />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProjectSelect;
