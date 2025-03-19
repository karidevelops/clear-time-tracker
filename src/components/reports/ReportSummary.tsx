
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileType } from "lucide-react";
import { TimeEntry } from "@/types/timeEntry";

interface ReportSummaryProps {
  timeEntries: TimeEntry[];
  totalHours: number;
  isLoading: boolean;
  exportToCsv: () => void;
  exportToExcel: () => void;
  exportToPdf: () => void;
}

const ReportSummary: React.FC<ReportSummaryProps> = ({
  timeEntries,
  totalHours,
  isLoading,
  exportToCsv,
  exportToExcel,
  exportToPdf
}) => {
  const { t } = useLanguage();

  return (
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
  );
};

export default ReportSummary;
