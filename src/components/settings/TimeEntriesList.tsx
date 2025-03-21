
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, RotateCcw } from "lucide-react";
import { TimeEntryWithDetails } from "@/types/timeEntry";
import { format } from "date-fns";
import { fi, sv, enUS } from 'date-fns/locale';

interface TimeEntriesListProps {
  userId: string;
  loading: boolean;
  entries: TimeEntryWithDetails[];
  handleEntryAction: (entryId: string, action: 'approve' | 'reject') => void;
}

export const TimeEntriesList: React.FC<TimeEntriesListProps> = ({
  userId,
  loading,
  entries,
  handleEntryAction
}) => {
  const { t, language } = useLanguage();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    let locale = enUS;
    
    if (language === 'fi') locale = fi;
    else if (language === 'sv') locale = sv;
    
    return format(date, 'PPP', { locale });
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <p>{t('loading')}...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-4 text-center">
        <p>{t('no_entries_found')}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">{t('date')}</TableHead>
          <TableHead className="text-xs">{t('hours')}</TableHead>
          <TableHead className="text-xs">{t('project')}</TableHead>
          <TableHead className="text-xs">{t('description')}</TableHead>
          <TableHead className="text-xs">{t('status')}</TableHead>
          <TableHead className="text-xs">{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(entry => (
          <TableRow key={entry.id}>
            <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
            <TableCell className="text-sm">{entry.hours}</TableCell>
            <TableCell className="text-sm">{entry.project_name} ({entry.client_name})</TableCell>
            <TableCell className="text-sm max-w-xs truncate">{entry.description || '-'}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`
                  ${entry.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' : 
                    entry.status === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-300' : 
                    'bg-gray-100 text-gray-800 border-gray-300'}
                `}
              >
                {t(entry.status)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {entry.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      onClick={() => handleEntryAction(entry.id, 'approve')}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {t('approve')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      onClick={() => handleEntryAction(entry.id, 'reject')}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {t('return')}
                    </Button>
                  </>
                )}
                {entry.status === 'approved' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                    onClick={() => handleEntryAction(entry.id, 'reject')}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    {t('return')}
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
