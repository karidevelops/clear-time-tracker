
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import custom components
import ReportFilters from "@/components/reports/ReportFilters";
import ReportSummary from "@/components/reports/ReportSummary";
import TimeEntriesTable from "@/components/reports/TimeEntriesTable";
import ApprovalSection from "@/components/reports/ApprovalSection";
import ApprovalDialog from "@/components/reports/ApprovalDialog";
import { TimeEntry } from "@/types/timeEntry";

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
        const entriesWithUserNames = data.map(entry => {
          let userName = t('unknown_user');
          
          if (entry.profiles && typeof entry.profiles === 'object' && entry.profiles !== null && !('error' in entry.profiles)) {
            userName = entry.profiles.full_name || t('unknown_user');
          }
          
          return {
            ...entry,
            user_full_name: userName,
            status: entry.status as TimeEntryStatus
          };
        });
        
        setPendingEntries(entriesWithUserNames);
        
        const grouped: { [key: string]: TimeEntry[] } = {};
        entriesWithUserNames.forEach(entry => {
          const userName = entry.user_full_name || t('unknown_user');
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

  const handleProjectSelect = (projectId: string, clientId: string | null) => {
    setSelectedProject(projectId);
    setSelectedClientId(clientId);
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
          <ReportFilters 
            dateRange={dateRange}
            setDateRange={setDateRange}
            filterPeriod={filterPeriod}
            setFilterPeriod={setFilterPeriod}
            selectedProject={selectedProject}
            handleProjectSelect={handleProjectSelect}
          />

          <ReportSummary 
            timeEntries={timeEntries}
            totalHours={totalHours}
            isLoading={isLoading}
            exportToCsv={exportToCsv}
            exportToExcel={exportToExcel}
            exportToPdf={exportToPdf}
          />

          <div className="border rounded-md">
            <TimeEntriesTable 
              timeEntries={timeEntries}
              isLoading={isLoading}
              getClientName={getClientName}
              getProjectName={getProjectName}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="approve-entries">
          <ReportFilters 
            dateRange={dateRange}
            setDateRange={setDateRange}
            filterPeriod={filterPeriod}
            setFilterPeriod={setFilterPeriod}
            selectedProject={selectedProject}
            handleProjectSelect={handleProjectSelect}
            isApproval={true}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            users={users}
          />

          <ApprovalSection 
            pendingEntries={pendingEntries}
            loadingPendingEntries={loadingPendingEntries}
            groupedByUser={groupedByUser}
            approveMonthEntries={approveMonthEntries}
            approveUserEntries={approveUserEntries}
            handleApprove={handleApprove}
            getClientName={getClientName}
            getProjectName={getProjectName}
            approvingEntries={approvingEntries}
          />
        </TabsContent>
      </Tabs>
      
      <ApprovalDialog 
        showApproveDialog={showApproveDialog}
        setShowApproveDialog={setShowApproveDialog}
        entryToApprove={entryToApprove}
        confirmApproval={confirmApproval}
        getProjectName={getProjectName}
      />
    </div>
  );
};

export default Reports;
