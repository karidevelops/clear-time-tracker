
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { TimeEntry, TimeEntryStatus } from '@/types/timeEntry';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

interface ReportFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  userId: string;
  projectId: string;
  clientId: string;
  status: TimeEntryStatus[];
}

// Define the type for the time entry response from Supabase
interface TimeEntryWithProfile {
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
  status: string;
  profiles: {
    full_name: string | null;
  } | null | any; // Adding 'any' to handle potential error responses
}

export const useReportData = (isAdmin: boolean, userId: string | undefined) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [approvingEntries, setApprovingEntries] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: new Date(),
      to: new Date()
    },
    userId: '',
    projectId: '',
    clientId: '',
    status: [] as TimeEntryStatus[]
  });
  const [loadingPendingEntries, setLoadingPendingEntries] = useState(false);

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
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      const fromDate = format(filters.dateRange.from, 'yyyy-MM-dd');
      const toDate = format(filters.dateRange.to, 'yyyy-MM-dd');
      
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          profiles (full_name)
        `)
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('user_id', userId);
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
      
      // First cast to unknown, then to our expected type to avoid TypeScript errors
      let filteredData = (data as unknown) as TimeEntryWithProfile[] || [];
      
      if (filters.clientId) {
        filteredData = filteredData.filter(entry => {
          const project = projects.find(p => p.id === entry.project_id);
          return project && project.client_id === filters.clientId;
        });
      }
      
      const mappedEntries = filteredData.map(entry => {
        let profileFullName = 'Unknown User';
        
        // More robust check for profiles data
        if (entry.profiles && 
            typeof entry.profiles === 'object' && 
            !('error' in entry.profiles) && 
            entry.profiles.full_name) {
          profileFullName = entry.profiles.full_name;
        }
        
        const entryWithStatus: TimeEntry = {
          ...entry,
          user_full_name: profileFullName,
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

  const getClientName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.clients?.name || 'Unknown Client' : 'Unknown Client';
  };

  const getProjectName = (projectId: string): string => {
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
          approved_by: userId,
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

  const approveUserEntries = async (entryUserId: string) => {
    try {
      setApprovingEntries(true);
      const { error } = await supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString()
        })
        .eq('status', 'pending')
        .eq('user_id', entryUserId);

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
          approved_by: userId,
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

  const handleFilterChange = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

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

  const totalHours = filteredEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);

  return {
    isLoading,
    timeEntries,
    filteredEntries,
    clients,
    projects,
    users,
    approvingEntries,
    filters,
    loadingPendingEntries,
    groupedByUser,
    totalHours,
    setFilters,
    fetchClients,
    fetchProjects,
    fetchUsers,
    fetchTimeEntries,
    getClientName,
    getProjectName,
    handleApprove,
    approveUserEntries,
    approveMonthEntries,
    handleFilterChange
  };
};
