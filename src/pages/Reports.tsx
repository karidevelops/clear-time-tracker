import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportSummary from '@/components/reports/ReportSummary';
import TimeEntriesTable from '@/components/reports/TimeEntriesTable';
import ApprovalSection from '@/components/reports/ApprovalSection';
import { TimeEntry, TimeEntryStatus } from '@/types/timeEntry';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const Reports = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [approvingEntries, setApprovingEntries] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: {
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1))
    },
    userId: '',
    projectId: '',
    clientId: '',
    status: [] as TimeEntryStatus[]
  });
  const [loadingPendingEntries, setLoadingPendingEntries] = useState(false);

  // Group pending entries by user
  const groupedByUser = timeEntries
    .filter(entry => entry.status === 'pending')
    .reduce<{ [key: string]: TimeEntry[] }>((acc, entry) => {
      const userName = entry.user_full_name || 'Unknown User';
      if (!acc[userName]) {
        acc[userName] = [];
      }
      acc[userName].push(entry);
      return acc;
    }, {});

  const checkUserRole = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }
      
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Exception checking admin status:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .order('name');
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTimeEntries = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const fromDate = format(filters.dateRange.from, 'yyyy-MM-dd');
      const toDate = format(filters.dateRange.to, 'yyyy-MM-dd');
      
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          profiles(full_name)
        `)
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      } else if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let filteredData = data || [];
      if (filters.clientId) {
        filteredData = filteredData.filter(entry => {
          const project = projects.find(p => p.id === entry.project_id);
          return project && project.client_id === filters.clientId;
        });
      }
      
      const mappedEntries = filteredData.map(entry => {
        const profileFullName = entry.profiles ? entry.profiles.full_name : null;
        const entryWithStatus: TimeEntry = {
          ...entry,
          user_full_name: profileFullName || 'Unknown User',
          status: (entry.status as TimeEntryStatus) || 'draft'
        };
        return entryWithStatus;
      });
      
      setTimeEntries(mappedEntries);
      setFilteredEntries(mappedEntries);
      
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error(t('error_fetching_time_entries'));
    } finally {
      setIsLoading(false);
    }
  };

  const totalHours = filteredEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const getClientName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.clients?.name || 'Unknown Client' : 'Unknown Client';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const handleApprove = async (entry: TimeEntry) => {
    try {
      setApprovingEntries(true);
      const { error } = await supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', entry.id);

      if (error) throw error;
      
      toast.success(t('entry_approved'));
      fetchTimeEntries();
    } catch (error) {
      console.error('Error approving entry:', error);
      toast.error(t('error_approving_entry'));
    } finally {
      setApprovingEntries(false);
    }
  };

  const approveUserEntries = async (userId: string) => {
    try {
      setApprovingEntries(true);
      const { error } = await supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('status', 'pending')
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success(t('entries_approved'));
      fetchTimeEntries();
    } catch (error) {
      console.error('Error approving entries:', error);
      toast.error(t('error_approving_entries'));
    } finally {
      setApprovingEntries(false);
    }
  };

  const approveMonthEntries = async () => {
    try {
      setApprovingEntries(true);
      const { error } = await supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('status', 'pending');

      if (error) throw error;
      
      toast.success(t('all_entries_approved'));
      fetchTimeEntries();
    } catch (error) {
      console.error('Error approving all entries:', error);
      toast.error(t('error_approving_all_entries'));
    } finally {
      setApprovingEntries(false);
    }
  };

  const exportToCsv = () => {
    if (filteredEntries.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8;";
    
    csvContent += "Date,Client,Project,Description,Hours,Status\n";
    
    filteredEntries.forEach(entry => {
      const row = [
        format(new Date(entry.date), 'yyyy-MM-dd'),
        getClientName(entry.project_id),
        getProjectName(entry.project_id),
        entry.description || '',
        entry.hours,
        entry.status
      ];
      
      const formattedRow = row.map(cell => {
        const cellStr = String(cell);
        return cellStr.includes(',') || cellStr.includes('"') 
          ? `"${cellStr.replace(/"/g, '""')}"` 
          : cellStr;
      });
      
      csvContent += formattedRow.join(',') + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `time-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (filteredEntries.length === 0) return;
    
    const worksheet = XLSX.utils.json_to_sheet(
      filteredEntries.map(entry => ({
        Date: format(new Date(entry.date), 'yyyy-MM-dd'),
        Client: getClientName(entry.project_id),
        Project: getProjectName(entry.project_id),
        Description: entry.description || '',
        Hours: entry.hours,
        Status: entry.status,
        User: entry.user_full_name
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Time Entries");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    if (filteredEntries.length === 0) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Time Report", 14, 22);
    
    doc.setFontSize(11);
    doc.text(
      `${format(filters.dateRange.from, 'yyyy-MM-dd')} to ${format(filters.dateRange.to, 'yyyy-MM-dd')}`,
      14, 32
    );
    
    doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 14, 42);
    
    const tableData = filteredEntries.map(entry => [
      format(new Date(entry.date), 'yyyy-MM-dd'),
      getClientName(entry.project_id),
      getProjectName(entry.project_id),
      entry.description || '',
      entry.hours.toString(),
      entry.status,
      entry.user_full_name
    ]);
    
    autoTable(doc, {
      head: [['Date', 'Client', 'Project', 'Description', 'Hours', 'Status', 'User']],
      body: tableData,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 100, 100] }
    });
    
    doc.save(`time-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  useEffect(() => {
    checkUserRole();
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchClients();
      fetchProjects();
      fetchUsers();
    }
  }, [user, isAdmin]);
  
  useEffect(() => {
    if (user) {
      fetchTimeEntries();
    }
  }, [user, isAdmin, filters]);

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold text-reportronic-800">{t('reports')}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('generate_report')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportFilters 
              dateRange={filters.dateRange}
              setDateRange={(newDateRange: any) => setFilters({...filters, dateRange: newDateRange})}
              filterPeriod="last-month"
              setFilterPeriod={() => {}}
              selectedProject={filters.projectId}
              handleProjectSelect={(projectId) => setFilters({...filters, projectId})}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>
        
        <ReportSummary 
          timeEntries={filteredEntries}
          totalHours={totalHours}
          isLoading={isLoading}
          exportToCsv={exportToCsv}
          exportToExcel={exportToExcel}
          exportToPdf={exportToPdf}
        />
        
        {isAdmin && (
          <ApprovalSection 
            pendingEntries={timeEntries.filter(entry => entry.status === 'pending')}
            loadingPendingEntries={loadingPendingEntries}
            groupedByUser={groupedByUser}
            approveMonthEntries={approveMonthEntries}
            approveUserEntries={approveUserEntries}
            handleApprove={handleApprove}
            getClientName={getClientName}
            getProjectName={getProjectName}
            approvingEntries={approvingEntries}
          />
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>{t('time_entries')}</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeEntriesTable 
              timeEntries={filteredEntries}
              isLoading={isLoading}
              getClientName={getClientName}
              getProjectName={getProjectName}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
