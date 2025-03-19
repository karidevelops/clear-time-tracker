
import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeEntry } from "@/types/timeEntry";

interface ApprovalSectionProps {
  pendingEntries: TimeEntry[];
  loadingPendingEntries: boolean;
  groupedByUser: { [key: string]: TimeEntry[] };
  approveMonthEntries: () => Promise<void>;
  approveUserEntries: (userId: string) => Promise<void>;
  handleApprove: (entry: TimeEntry) => void;
  getClientName: (projectId: string) => string;
  getProjectName: (projectId: string) => string;
  approvingEntries: boolean;
}

const ApprovalSection: React.FC<ApprovalSectionProps> = ({
  pendingEntries,
  loadingPendingEntries,
  groupedByUser,
  approveMonthEntries,
  approveUserEntries,
  handleApprove,
  getClientName,
  getProjectName,
  approvingEntries,
}) => {
  const { t } = useLanguage();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
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
    </div>
  );
};

export default ApprovalSection;
