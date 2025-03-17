
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

// Import new components
import FilterSection, { DateRange, FilterPeriod } from "@/components/reports/FilterSection";
import SummarySection from "@/components/reports/SummarySection";
import ResultsTable from "@/components/reports/ResultsTable";

// Time entry interface matching the database schema
interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project_id: string;
  description: string | null;
  user_id: string;
}

// Project interface for the data from Supabase
interface Project {
  id: string;
  name: string;
  client_id: string;
}

// Client interface for the data from Supabase
interface Client {
  id: string;
  name: string;
}

const Reports = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch clients from Supabase
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
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
      
      return data || [];
    }
  });
  
  // Fetch projects from Supabase
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client_id');
      
      if (error) {
        console.error('Error fetching projects:', error);
        toast.error(t('error_fetching_projects'));
        return [];
      }
      
      return data || [];
    }
  });

  // Get filtered projects for the selected client
  const clientProjects = selectedClient 
    ? projects.filter(project => project.client_id === selectedClient)
    : [];

  // Fetch time entries from Supabase
  useEffect(() => {
    if (!user) return;
    
    const fetchTimeEntries = async () => {
      setIsLoading(true);
      try {
        // Build the query
        let query = supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        
        // Add date range filters if set
        if (dateRange.from) {
          const fromDateStr = format(dateRange.from, 'yyyy-MM-dd');
          query = query.gte('date', fromDateStr);
        }
        
        if (dateRange.to) {
          const toDateStr = format(dateRange.to, 'yyyy-MM-dd');
          query = query.lte('date', toDateStr);
        }
        
        // Add project filter if set
        if (selectedProject) {
          query = query.eq('project_id', selectedProject);
        } 
        // If client is selected but no project, filter by all projects of the client
        else if (selectedClient && clientProjects.length > 0) {
          const projectIds = clientProjects.map(p => p.id);
          query = query.in('project_id', projectIds);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching time entries:", error);
          toast.error(t('error_fetching_time_entries'));
          return;
        }
        
        if (data) {
          setTimeEntries(data as TimeEntry[]);
        }
      } catch (error) {
        console.error("Exception fetching time entries:", error);
        toast.error(t('error_fetching_time_entries'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimeEntries();
  }, [user, dateRange, selectedProject, selectedClient, clientProjects, t]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="h-7 w-7 text-reportronic-600" />
        <h1 className="text-3xl font-bold text-reportronic-800">{t('reports')}</h1>
      </div>

      {/* Filters */}
      <FilterSection
        dateRange={dateRange}
        setDateRange={setDateRange}
        filterPeriod={filterPeriod}
        setFilterPeriod={setFilterPeriod}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        clients={clients}
        isLoadingClients={isLoadingClients}
        isLoadingProjects={isLoadingProjects}
      />

      {/* Summary */}
      <SummarySection
        timeEntries={timeEntries}
        projects={projects}
        clients={clients}
        isLoading={isLoading}
      />

      {/* Results Table */}
      <ResultsTable
        timeEntries={timeEntries}
        projects={projects}
        clients={clients}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Reports;
