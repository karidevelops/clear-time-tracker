
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
import { Calendar as CalendarIcon, FileText, Download, FileSpreadsheet, FileType, CheckCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TimeEntryStatus = "draft" | "pending" | "approved";

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project_id: string;
  description: string | null;
  user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  status: TimeEntryStatus;
  user_full_name?: string;
  profiles?: {
    full_name: string | null;
  } | null;
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
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("own-report");
  const [pendingEntries, setPendingEntries] = useState<TimeEntry[]>([]);
  const [loadingPendingEntries, setLoadingPendingEntries] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [users, setUsers] = useState<Array<{id: string, full_name: string}>>([]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [entryToApprove, setEntryToApprove] = useState<TimeEntry | null>(null);
  const [approvingEntries, setApprovingEntries] = useState(false);
  const [groupedByUser, setGroupedByUser] = useState<{ [key: string]: TimeEntry[] }>({});

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
        } else if (selectedClientId) {
          const clientProjects = projects
            .filter(p => p.client_id === selectedClientId)
            .map(p => p.id);
          
          if (clientProjects.length > 0) {
            query = query.in('project_id', clientProjects);
          }
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
  }, [user, dateRange, selectedProject, selectedClientId, projects, t]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name');
    
    if (error) {
      console.error('Error fetching users:', error);
      toast.error(t('error_fetching_users'));
      return;
    }
    
    if (data) {
      setUsers(data);
    }
  };

  const fetchPendingEntries = async () => {
    if (!user) return;
    
    setLoadingPendingEntries(true);
    try {
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('status', 'pending')
        .order('date', { ascending: false });
      
      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }
      
      if (dateRange.from) {
        const fromDateStr = format(dateRange.from, 'yyyy-MM-dd');
        query = query.gte('date', fromDateStr);
      }
      
      if (dateRange.to) {
        const toDateStr = format(dateRange.to, 'yyyy-MM-dd');
        query = query.lte('date', toDateStr);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching pending time entries:", error);
        toast.error(t('error_fetching_time_entries'));
        return;
      }
      
      if (data) {
        const entriesWithUserNames = data.map(entry => ({
          ...entry,
          user_full_name: entry.profiles?.full_name || t('unknown_user'),
          status: entry.status as TimeEntryStatus
        }));
        
        setPendingEntries(entriesWithUserNames);
        
        // Group entries by user for bulk approval
        const grouped: { [key: string]: TimeEntry[] } = {};
        entriesWithUserNames.forEach(entry => {
          const userName = entry.profiles?.full_name || t('unknown_user');
          if (!grouped[userName]) {
            grouped[userName] = [];
          }
          grouped[userName].push(entry);
        });
        setGroupedByUser(grouped);
      }
    } catch (error) {
      console.error("Exception fetching pending time entries:", error);
      toast.error(t('error_fetching_time_entries'));
    } finally {
      setLoadingPendingEntries(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'approve-entries') {
      fetchUsers();
      fetchPendingEntries();
    }
  }, [activeTab, selectedUser, dateRange]);

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

  const handleProjectSelect = (projectId: string, clientId: string | null) => {
    setSelectedProject(projectId);
    setSelectedClientId(clientId);
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

  const handleApprove = async (entry: TimeEntry) => {
    setEntryToApprove(entry);
    setShowApproveDialog(true);
  };

  const confirmApproval = async () => {
    if (!entryToApprove || !user) return;
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', entryToApprove.id);
      
      if (error) {
        console.error("Error approving time entry:", error);
        toast.error(t('error_approving_time_entry'));
        return;
      }
      
      toast.success(t('time_entry_approved'));
      fetchPendingEntries();
    } catch (error) {
      console.error("Exception approving time entry:", error);
      toast.error(t('error_approving_time_entry'));
    } finally {
      setShowApproveDialog(false);
      setEntryToApprove(null);
    }
  };

  const approveUserEntries = async (userId: string) => {
    if (!user) return;
    
    setApprovingEntries(true);
    try {
      const entriesToApprove = pendingEntries.filter(entry => entry.user_id === userId);
      
      if (entriesToApprove.length === 0) {
        toast.error(t('no_entries_to_approve'));
        return;
      }
      
      const { error } = await supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .in('id', entriesToApprove.map(entry => entry.id));
      
      if (error) {
        console.error("Error approving time entries:", error);
        toast.error(t('error_approving_time_entries'));
        return;
      }
      
      toast.success(`${entriesToApprove.length} ${t('time_entries_approved')}`);
      fetchPendingEntries();
    } catch (error) {
      console.error("Exception approving time entries:", error);
      toast.error(t('error_approving_time_entries'));
    } finally {
      setApprovingEntries(false);
    }
  };

  const approveMonthEntries = async () => {
    if (!user || pendingEntries.length === 0) {
      toast.error(t('no_entries_to_approve'));
      return;
    }
    
    setApprovingEntries(true);
    try {
      // Get all entries for the selected month range
      let entriesToApprove = pendingEntries;
      
      if (entriesToApprove.length === 0) {
        toast.error(t('no_entries_to_approve'));
        return;
      }
      
      const { error } = await supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .in('id', entriesToApprove.map(entry => entry.id));
      
      if (error) {
        console.error("Error approving time entries:", error);
        toast.error(t('error_approving_time_entries'));
        return;
      }
      
      toast.success(`${entriesToApprove.length} ${t('time_entries_approved')}`);
      fetchPendingEntries();
    } catch (error) {
      console.error("Exception approving time entries:", error);
      toast.error(t('error_approving_time_entries'));
    } finally {
      setApprovingEntries(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="h-7 w-7 text-reportronic-600" />
        <h1 className="text-3xl font-bold text-reportronic-800">{t('reports')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="own-report">{t('own_report')}</TabsTrigger>
          <TabsTrigger value="approve-entries">{t('approve_entries')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="own-report">
          <div className="bg-white p-6 rounded-lg border mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('filter_reports')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">{t('project')}</label>
                <ProjectSelect 
                  value={selectedProject} 
                  onChange={(projectId, clientId) => handleProjectSelect(projectId, clientId)} 
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
                  <FileType className="mr-2 h-4 w-4" />
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
        </TabsContent>
        
        <TabsContent value="approve-entries">
          <div className="bg-white p-6 rounded-lg border mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('filter_pending_entries')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">{t('user')}</label>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-reportronic-500 focus:ring-reportronic-500"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="all">{t('all_users')}</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || t('unnamed_user')}
                    </option>
                  ))}
                </select>
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
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('quick_filters')}</label>
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-6">
              <h3 className="text-lg font-medium">{pendingEntries.length} {t('pending_entries')}</h3>
              
              {pendingEntries.length > 0 && (
                <Button
                  onClick={approveMonthEntries}
                  disabled={approvingEntries || pendingEntries.length === 0}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t('approve_all_entries')}
                </Button>
              )}
            </div>
          </div>

          <div className="border rounded-md">
            {loadingPendingEntries ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-reportronic-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">{t('loading_time_entries')}</p>
              </div>
            ) : (
              <div>
                {Object.keys(groupedByUser).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {t('no_pending_entries')}
                  </div>
                ) : (
                  <div>
                    {Object.entries(groupedByUser).map(([userName, entries]) => (
                      <div key={userName} className="border-b last:border-b-0">
                        <div className="flex justify-between items-center p-4 bg-gray-50">
                          <h3 className="font-medium">{userName} ({entries.length} {t('entries')})</h3>
                          <Button 
                            size="sm"
                            onClick={() => approveUserEntries(entries[0].user_id)}
                            disabled={approvingEntries}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t('approve_all_user_entries')}
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('date')}</TableHead>
                              <TableHead>{t('client')}</TableHead>
                              <TableHead>{t('project')}</TableHead>
                              <TableHead>{t('description')}</TableHead>
                              <TableHead className="text-right">{t('hours')}</TableHead>
                              <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell>{format(parseISO(entry.date), 'dd.MM.yyyy')}</TableCell>
                                <TableCell>{getClientName(entry.project_id)}</TableCell>
                                <TableCell>{getProjectName(entry.project_id)}</TableCell>
                                <TableCell>{entry.description || "-"}</TableCell>
                                <TableCell className="text-right font-medium">{Number(entry.hours).toFixed(1)}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleApprove(entry)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('approve_time_entry')}</DialogTitle>
            <DialogDescription>
              {t('approve_time_entry_confirmation')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {entryToApprove && (
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-sm text-gray-500">{t('date')}</div>
                    <div>{format(parseISO(entryToApprove.date), 'dd.MM.yyyy')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{t('hours')}</div>
                    <div>{Number(entryToApprove.hours).toFixed(1)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-500">{t('project')}</div>
                    <div>{getProjectName(entryToApprove.project_id)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-500">{t('description')}</div>
                    <div>{entryToApprove.description || "-"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>{t('cancel')}</Button>
            <Button onClick={confirmApproval}>{t('approve')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
