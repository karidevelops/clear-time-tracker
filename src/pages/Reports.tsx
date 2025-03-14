import React, { useState } from "react";
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
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar as CalendarIcon, FileText, BarChart3, Download } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { clients, getAllProjects, Project, getClientById } from "@/data/ClientsData";
import ProjectSelect from "@/components/ProjectSelect";
import { cn } from "@/lib/utils";

// Mock time entries data
interface TimeEntry {
  id: string;
  date: Date;
  hours: number;
  projectId: string;
  description: string;
}

const mockTimeEntries: TimeEntry[] = [
  { id: "1", date: new Date(2023, 5, 1), hours: 4.5, projectId: "101", description: "Development work" },
  { id: "2", date: new Date(2023, 5, 1), hours: 3, projectId: "202", description: "Design updates" },
  { id: "3", date: new Date(2023, 5, 2), hours: 7.5, projectId: "101", description: "API implementation" },
  { id: "4", date: new Date(2023, 5, 3), hours: 6, projectId: "302", description: "Documentation" },
  { id: "5", date: new Date(2023, 5, 5), hours: 8, projectId: "201", description: "Backend work" },
  { id: "6", date: new Date(2023, 5, 8), hours: 5, projectId: "102", description: "Mobile app updates" },
  { id: "7", date: new Date(2023, 5, 10), hours: 4, projectId: "301", description: "Testing" },
  { id: "8", date: new Date(2023, 5, 12), hours: 7, projectId: "102", description: "UI improvements" },
  { id: "9", date: new Date(2023, 5, 15), hours: 6.5, projectId: "201", description: "API debugging" },
  { id: "10", date: new Date(2023, 6, 1), hours: 8, projectId: "301", description: "Documentation updates" },
];

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type FilterPeriod = "all" | "week" | "month" | "last-month" | "custom";

const Reports = () => {
  const { t } = useLanguage();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");

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

  // Filter entries based on selected project and date range
  const filteredEntries = mockTimeEntries.filter(entry => {
    // Filter by project if selected
    if (selectedProject && entry.projectId !== selectedProject) {
      return false;
    }
    
    // Filter by date range if set
    if (dateRange.from && entry.date < dateRange.from) {
      return false;
    }
    
    if (dateRange.to) {
      // Include the entire day for the end date
      const endDate = new Date(dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      if (entry.date > endDate) {
        return false;
      }
    }
    
    return true;
  });

  // Calculate total hours
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);

  // Helper function to get project name
  const getProjectName = (projectId: string): string => {
    const allProjects = getAllProjects();
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : t('unknown_project');
  };

  // Helper function to get client name
  const getClientName = (projectId: string): string => {
    const allProjects = getAllProjects();
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return t('unknown_client');
    
    const client = getClientById(project.clientId);
    return client ? client.name : t('unknown_client');
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
          {/* Project filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('project')}</label>
            <ProjectSelect 
              value={selectedProject} 
              onChange={setSelectedProject} 
            />
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
          <div className="lg:col-span-2">
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
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            {t('export_to_csv')}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md border">
            <div className="text-sm text-gray-500">{t('total_entries')}</div>
            <div className="text-2xl font-bold">{filteredEntries.length}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border">
            <div className="text-sm text-gray-500">{t('total_hours')}</div>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border">
            <div className="text-sm text-gray-500">{t('avg_hours_per_day')}</div>
            <div className="text-2xl font-bold">
              {filteredEntries.length > 0 
                ? (totalHours / [...new Set(filteredEntries.map(e => 
                    format(e.date, 'yyyy-MM-dd')))].length).toFixed(1) 
                : '0.0'}
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
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
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  {t('no_time_entries_found')}
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(entry.date, 'dd.MM.yyyy')}</TableCell>
                  <TableCell>{getClientName(entry.projectId)}</TableCell>
                  <TableCell>{getProjectName(entry.projectId)}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className="text-right font-medium">{entry.hours.toFixed(1)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Reports;
