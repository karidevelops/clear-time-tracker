
import React from "react";
import { format, parseISO } from "date-fns";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project_id: string;
  description: string | null;
  user_id: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
}

interface Client {
  id: string;
  name: string;
}

interface ResultsTableProps {
  timeEntries: TimeEntry[];
  projects: Project[];
  clients: Client[];
  isLoading: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  timeEntries,
  projects,
  clients,
  isLoading,
}) => {
  const { t } = useLanguage();
  
  // Helper function to get project name from project ID
  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : t('unknown_project');
  };

  // Helper function to get client name from project ID
  const getClientName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return t('unknown_client');
    
    const client = clients.find(c => c.id === project.client_id);
    return client ? client.name : t('unknown_client');
  };

  if (isLoading) {
    return (
      <div className="border rounded-md">
        <div className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-reportronic-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">{t('loading_time_entries')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('date')}</TableHead>
            <TableHead>{t('client')}</TableHead>
            <TableHead>{t('project')}</TableHead>
            <TableHead>{t('description')}</TableHead>
            <TableHead className="text-right">{t('hours')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeEntries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                {t('no_time_entries_found')}
              </TableCell>
            </TableRow>
          ) : (
            timeEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{format(parseISO(entry.date), 'dd.MM.yyyy')}</TableCell>
                <TableCell>{getClientName(entry.project_id)}</TableCell>
                <TableCell>{getProjectName(entry.project_id)}</TableCell>
                <TableCell>{entry.description || "-"}</TableCell>
                <TableCell className="text-right font-medium">{Number(entry.hours).toFixed(1)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;
