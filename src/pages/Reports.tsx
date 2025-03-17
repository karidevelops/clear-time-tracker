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
import { Calendar as CalendarIcon, FileText, Download, FileSpreadsheet, FilePdf } from "lucide-react";
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
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type FilterPeriod = "all" | "week" | "month" | "last-month" | "custom";

const Reports = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: clients = [] } = useQuery<Client[]>({
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
  
  const { data: projects = [] } = useQuery<Project[]>({
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

  useEffect(() => {
    if (!user) return;
    
    const fetchTimeEntries = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        
        if (dateRange.from) {
          const fromDateStr = format(dateRange.from, 'yyyy-MM-dd');
          query = query.gte('date', fromDateStr);
        }
        
        if (dateRange.to) {
          const toDateStr = format(dateRange.to, 'yyyy-MM-dd');
          query = query.lte('date', toDateStr);
        }
        
        if (selectedProject && selectedProject !== 'all') {
          query = query.eq('project_id', selectedProject);
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
  }, [user, dateRange, selectedProject, t]);

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
      case "custom":
        break;
    }
    
    setFilterPeriod(period);
  };

  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : t('unknown_project');
  };

  const getClientName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return t('unknown_client');
    
    const client = clients.find(c => c.id === project.client_id);
    return client ? client.name : t('unknown_client');
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);

  const prepareReportData = () => {
    if (timeEntries.length === 0) {
      toast.error(t('no_data_to_export'));
      return null;
    }
    
    return timeEntries.map(entry => ({
      date: format(parseISO(entry.date), 'dd.MM.yyyy'),
      client: getClientName(entry.project_id),
      project: getProjectName(entry.project_id),
      description: entry.description || '',
      hours: Number(entry.hours).toFixed(1)
    }));
  };

  const exportToCsv = () => {
    const data = prepareReportData();
    if (!data) return;
    
    const headers = [t('date'), t('client'), t('project'), t('description'), t('hours')];
    
    const rows = data.map(row => [
      row.date,
      row.client,
      row.project,
      row.description,
      row.hours
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
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

  const exportToExcel = () => {
    const data = prepareReportData();
    if (!data) return;
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('time_report'));
    
    const headers = [t('date'), t('client'), t('project'), t('description'), t('hours')];
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
    
    const maxWidths = [
      10,
      20,
      20,
      40,
      8,
    ];
    
    const colWidths = {};
    maxWidths.forEach((width, i) => {
      const col = String.fromCharCode(65 + i);
      colWidths[col] = { width };
    });
    worksheet['!cols'] = Object.values(colWidths);
    
    XLSX.writeFile(workbook, `time-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast.success(t('report_exported'));
  };

  const exportToPdf = () => {
    const data = prepareReportData();
    if (!data) return;
    
    const doc = new jsPDF();
    
    const title = t('time_report');
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    const dateRangeText = dateRange.from && dateRange.to
      ? `${format(dateRange.from, 'dd.MM.yyyy')} - ${format(dateRange.to, 'dd.MM.yyyy')}`
      : t('all_time');
    doc.setFontSize(12);
    doc.text(dateRangeText, 14, 30);
    
    doc.text(`${t('total_entries')}: ${timeEntries.length}`, 14, 40);
    doc.text(`${t('total_hours')}: ${totalHours.toFixed(1)}`, 14, 48);
    
    const tableData = data.map(row => [
      row.date,
      row.client,
      row.project,
      row.description,
      row.hours
    ]);
    
    const headers = [t('date'), t('client'), t('project'), t('description'), t('hours')];
    
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 60,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 20, halign: 'center' },
      },
      headStyles: {
        fillColor: [253, 126, 30],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
    });
    
    doc.save(`time-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast.success(t('report_exported'));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="h-7 w-7 text-reportronic-600" />
        <h1 className="text-3xl font-bold text-reportronic-800">{t('reports')}</h1>
      </div>

      <div className="bg-white p-6 rounded-lg border mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('filter_reports')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('project')}</label>
            <ProjectSelect 
              value={selectedProject} 
              onChange={setSelectedProject} 
            />
          </div>
          
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

      <div className="bg-white p-6 rounded-lg border mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('summary')}</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportToCsv}
              disabled={timeEntries.length === 0 || isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('export_to_csv')}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportToExcel}
              disabled={timeEntries.length === 0 || isLoading}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {t('export_to_excel')}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportToPdf}
              disabled={timeEntries.length === 0 || isLoading}
            >
              <FilePdf className="mr-2 h-4 w-4" />
              {t('export_to_pdf')}
            </Button>
          </div>
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
