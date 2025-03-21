
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { fi, sv, enUS } from 'date-fns/locale';

interface BulkApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export const BulkApprovalDialog: React.FC<BulkApprovalDialogProps> = ({
  open,
  onOpenChange,
  selectedMonth,
  onMonthChange,
  onConfirm,
  loading
}) => {
  const { t, language } = useLanguage();

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    let locale = enUS;
    if (language === 'fi') locale = fi;
    else if (language === 'sv') locale = sv;
    
    return format(date, 'MMMM yyyy', { locale });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('approve_all_hours')}</DialogTitle>
          <DialogDescription>
            {t('approve_all_hours_description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Label htmlFor="month-select">{t('select_month')}</Label>
          <Select 
            value={selectedMonth} 
            onValueChange={onMonthChange}
          >
            <SelectTrigger id="month-select" className="w-full mt-2">
              <SelectValue placeholder={t('select_month')} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthValue = date.toISOString().substring(0, 7); // YYYY-MM
                return (
                  <SelectItem key={monthValue} value={monthValue}>
                    {getMonthName(monthValue)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <p className="mt-4 text-sm text-gray-600">
            {t('approve_all_hours_warning')}
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            <CalendarCheck className="mr-2 h-4 w-4" />
            {loading ? t('approving') : t('approve_all')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
