
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ReportFilters from "@/components/reports/ReportFilters";
import { TimeEntryStatus } from "@/types/timeEntry";

interface ReportFiltersUIProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  projectId: string;
  isAdmin: boolean;
  onFilterChange: (filters: any) => void;
}

const ReportFiltersUI: React.FC<ReportFiltersUIProps> = ({
  dateRange,
  projectId,
  isAdmin,
  onFilterChange
}) => {
  const { t } = useLanguage();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('generate_report')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ReportFilters 
          dateRange={dateRange}
          setDateRange={(newDateRange: any) => onFilterChange({dateRange: newDateRange})}
          filterPeriod="last-month"
          setFilterPeriod={() => {}}
          selectedProject={projectId}
          handleProjectSelect={(projectId) => onFilterChange({projectId})}
          isAdmin={isAdmin}
        />
      </CardContent>
    </Card>
  );
};

export default ReportFiltersUI;
