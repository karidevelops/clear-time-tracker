
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isApproving: boolean;
  onConfirm: (comment: string) => void;
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  open,
  onOpenChange,
  isApproving,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [comment, setComment] = React.useState("");

  const handleConfirm = () => {
    onConfirm(comment);
    setComment("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApproving ? t('approve_time_entry') : t('return_time_entry')}
          </DialogTitle>
          <DialogDescription>
            {isApproving 
              ? t('approve_time_entry_confirmation')
              : t('return_time_entry_confirmation')}
          </DialogDescription>
        </DialogHeader>
        
        {!isApproving && (
          <div className="my-4">
            <Textarea
              placeholder={t('rejection_comment_placeholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleConfirm}
            variant={isApproving ? "default" : "destructive"}
          >
            {isApproving ? t('approve') : t('return_for_edit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalDialog;
