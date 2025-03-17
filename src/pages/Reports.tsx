
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { Calendar as CalendarIcon, FileText, Download } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ProjectSelect from "@/components/ProjectSelect";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type FilterPeriod = "all" | "week" | "month" | "last-month" | "custom";

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

  // Reset selected project when client changes
  useEffect(() => {
    setSelectedProject("");
  }, [selectedClient]);

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

  // Apply date range filters based on selected period
  const applyDateFilter = (period: FilterPeriod) => {
    const today = new Date();
    
    switch (period) {
      case "week":
        setDateRange({
          from: startOfWeek(today, { weekStartsOn: 1 }),
          to: endOfWeek(today, { weekStartsOn: 1 }),
        });
        break;
      case "month":
        setDateRange({
          from: startOfMonth(today),
          to: endOfMonth(today),
        });
        break;
      case "last-month":
        const lastMonth = subMonths(today, 1);
        setDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        });
        break;
      case "all":
        setDateRange({
          from: undefined,
          to: undefined,
        });
        break;
      // When custom is selected, we keep the existing range if it exists
      case "custom":
        break;
    }
    
    setFilterPeriod(period);
  };

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

  // Calculate total hours
  const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);

  // Export to CSV
  const exportToCsv = () => {
    if (timeEntries.length === 0) {
      toast.error(t('no_data_to_export'));
      return;
    }
    
    // Format headers and data
    const headers = [t('date'), t('client'), t('project'), t('description'), t('hours')];
    
    const rows = timeEntries.map(entry => [
      format(parseISO(entry.date), 'dd.MM.yyyy'),
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="h-7 w-7 text-reportronic-600" />
        <h1 className="text-3xl font-bold text-reportronic-800">{t('reports')}</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('filter_reports')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Client filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('client')}</label>
            {isLoadingClients ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div>
                <Select 
                  value={selectedClient} 
                  onValueChange={setSelectedClient}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('select_client')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('all_clients')}</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Project filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('project')}</label>
            {isLoadingProjects ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <ProjectSelect 
                value={selectedProject} 
                onChange={setSelectedProject} 
                clientId={selectedClient}
              />
            )}
          </div>
          
          {/* Date range filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('date_range')}</label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                        </>
                      ) : (
                        format(dateRange.from, "PPP")
                      )
                    ) : (
                      <span>{t('select_date_range')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range as DateRange);
                      if (range?.from) setFilterPeriod("custom");
                    }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Quick date filters */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium mb-2">{t('quick_filters')}</label>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filterPeriod === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDateFilter("week")}
              >
                {t('this_week')}
              </Button>
              <Button 
                variant={filterPeriod === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDateFilter("month")}
              >
                {t('this_month')}
              </Button>
              <Button 
                variant={filterPeriod === "last-month" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDateFilter("last-month")}
              >
                {t('last_month')}
              </Button>
              <Button 
                variant={filterPeriod === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDateFilter("all")}
              >
                {t('all_time')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-6 rounded-lg border mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('summary')}</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportToCsv}
            disabled={timeEntries.length === 0 || isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('export_to_csv')}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md border">
            <div className="text-sm text-gray-500">{t('total_entries')}</div>
            <div className="text-2xl font-bold">{timeEntries.length}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border">
            <div className="text-sm text-gray-500">{t('total_hours')}</div>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border">
            <div className="text-sm text-gray-500">{t('avg_hours_per_day')}</div>
            <div className="text-2xl font-bold">
              {timeEntries.length > 0 
                ? (totalHours / [...new Set(timeEntries.map(e => e.date))].length).toFixed(1) 
                : '0.0'}
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-reportronic-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">{t('loading_time_entries')}</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Reports;

