
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeEntry } from "@/types/timeEntry";

interface ApprovalDialogProps {
  showApproveDialog: boolean;
  setShowApproveDialog: React.Dispatch<React.SetStateAction<boolean>>;
  entryToApprove: TimeEntry | null;
  confirmApproval: () => Promise<void>;
  getProjectName: (projectId: string) => string;
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  showApproveDialog,
  setShowApproveDialog,
  entryToApprove,
  confirmApproval,
  getProjectName,
}) => {
  const { t } = useLanguage();

  if (!entryToApprove) return null;

  return (
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
  );
};

export default ApprovalDialog;
