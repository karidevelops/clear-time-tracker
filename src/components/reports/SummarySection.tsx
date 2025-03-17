
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "date-fns";
import { toast } from "sonner";

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

interface SummarySectionProps {
  timeEntries: TimeEntry[];
  projects: Project[];
  clients: Client[];
  isLoading: boolean;
}

const SummarySection: React.FC<SummarySectionProps> = ({
  timeEntries,
  projects,
  clients,
  isLoading,
}) => {
  const { t } = useLanguage();
  
  // Ensure we have safeguarded arrays
  const safeTimeEntries = Array.isArray(timeEntries) ? timeEntries : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  
  // Calculate total hours
  const totalHours = safeTimeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
  
  // Helper function to get project name from project ID
  const getProjectName = (projectId: string): string => {
    const project = safeProjects.find(p => p.id === projectId);
    return project ? project.name : t('unknown_project');
  };

  // Helper function to get client name from project ID
  const getClientName = (projectId: string): string => {
    const project = safeProjects.find(p => p.id === projectId);
    if (!project) return t('unknown_client');
    
    const client = safeClients.find(c => c.id === project.client_id);
    return client ? client.name : t('unknown_client');
  };
  
  // Export to CSV
  const exportToCsv = () => {
    if (safeTimeEntries.length === 0) {
      toast.error(t('no_data_to_export'));
      return;
    }
    
    // Format headers and data
    const headers = [t('date'), t('client'), t('project'), t('description'), t('hours')];
    
    const rows = safeTimeEntries.map(entry => [
      format(new Date(entry.date), 'dd.MM.yyyy'),
      getClientName(entry.project_id),
      getProjectName(entry.project_id),
      entry.description || '',
      Number(entry.hours).toFixed(1)
    ]);
    
    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `time-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(t('report_exported'));
  };

  // Calculate unique dates for average hours calculation
  const uniqueDates = [...new Set(safeTimeEntries.map(e => e.date))];
  const avgHoursPerDay = uniqueDates.length > 0 
    ? (totalHours / uniqueDates.length).toFixed(1) 
    : '0.0';

  return (
    <div className="bg-white p-6 rounded-lg border mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('summary')}</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={exportToCsv}
          disabled={safeTimeEntries.length === 0 || isLoading}
        >
          <Download className="mr-2 h-4 w-4" />
          {t('export_to_csv')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-md border">
          <div className="text-sm text-gray-500">{t('total_entries')}</div>
          <div className="text-2xl font-bold">{safeTimeEntries.length}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-md border">
          <div className="text-sm text-gray-500">{t('total_hours')}</div>
          <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-md border">
          <div className="text-sm text-gray-500">{t('avg_hours_per_day')}</div>
          <div className="text-2xl font-bold">{avgHoursPerDay}</div>
        </div>
      </div>
    </div>
  );
};

export default SummarySection;
