
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { format, parseISO } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { TimeEntry } from "@/types/timeEntry";

interface TimeEntriesTableProps {
  timeEntries: TimeEntry[];
  isLoading: boolean;
  getClientName: (projectId: string) => string;
  getProjectName: (projectId: string) => string;
}

const TimeEntriesTable: React.FC<TimeEntriesTableProps> = ({
  timeEntries,
  isLoading,
  getClientName,
  getProjectName
}) => {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-reportronic-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">{t('loading_time_entries')}</p>
      </div>
    );
  }

  return (
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
  );
};

export default TimeEntriesTable;
