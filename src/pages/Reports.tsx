
import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import ReportSummary from '@/components/reports/ReportSummary';
import TimeEntriesTable from '@/components/reports/TimeEntriesTable';
import ApprovalSection from '@/components/reports/ApprovalSection';
import { useCheckAdmin } from '@/hooks/useCheckAdmin';
import { useReportData } from '@/hooks/useReportData';
import { exportToCsv, exportToExcel, exportToPdf } from '@/utils/reportExports';
import ReportFiltersUI from '@/components/reports/ReportFiltersUI';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

const Reports = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isAdmin } = useCheckAdmin();
  
  const initialDateRange = {
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1))
  };
  
  const {
    isLoading,
    timeEntries,
    filteredEntries,
    filters,
    groupedByUser,
    totalHours,
    approvingEntries,
    loadingPendingEntries,
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
  } = useReportData(isAdmin, user?.id);

  // Initialize filters with the default date range
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      dateRange: initialDateRange
    }));
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

  const handleExportToCsv = () => exportToCsv(filteredEntries, getClientName, getProjectName, t);
  const handleExportToExcel = () => exportToExcel(filteredEntries, getClientName, getProjectName, t);
  const handleExportToPdf = () => exportToPdf(filteredEntries, totalHours, getClientName, getProjectName, filters.dateRange, t);

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold text-reportronic-800">{t('reports')}</h1>
        
        <ReportFiltersUI 
          dateRange={filters.dateRange}
          projectId={filters.projectId}
          isAdmin={isAdmin}
          onFilterChange={handleFilterChange}
        />
        
        <ReportSummary 
          timeEntries={filteredEntries}
          totalHours={totalHours}
          isLoading={isLoading}
          exportToCsv={handleExportToCsv}
          exportToExcel={handleExportToExcel}
          exportToPdf={handleExportToPdf}
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
