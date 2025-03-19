
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import ProjectSelect from "@/components/ProjectSelect";
import { cn } from "@/lib/utils";

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type FilterPeriod = "all" | "week" | "month" | "last-month" | "custom";

interface ReportFiltersProps {
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  filterPeriod: FilterPeriod;
  setFilterPeriod: React.Dispatch<React.SetStateAction<FilterPeriod>>;
  selectedProject: string;
  handleProjectSelect: (projectId: string, clientId?: string | null) => void;
  isApproval?: boolean;
  selectedUser?: string;
  setSelectedUser?: React.Dispatch<React.SetStateAction<string>>;
  users?: Array<{id: string, full_name: string}>;
  // Adding the missing optional props
  clients?: any[];
  projects?: any[];
  isAdmin?: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  dateRange,
  setDateRange,
  filterPeriod,
  setFilterPeriod,
  selectedProject,
  handleProjectSelect,
  isApproval = false,
  selectedUser,
  setSelectedUser,
  users = [],
  // Add the new props with defaults
  clients = [],
  projects = [],
  isAdmin = false
}) => {
  const { t } = useLanguage();

  const applyDateFilter = (period: FilterPeriod) => {
    const today = new Date();
    
    switch (period) {
      case "week":
        setDateRange({
          from: startOfWeek(today, { weekStartsOn: 1 }),
          to: endOfWeek(today, { weekStartsOn: 1 }),
        });
        break;
      case "month":
        setDateRange({
          from: startOfMonth(today),
          to: endOfMonth(today),
        });
        break;
      case "last-month":
        const lastMonth = subMonths(today, 1);
        setDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        });
        break;
      case "all":
        setDateRange({
          from: undefined,
          to: undefined,
        });
        break;
      case "custom":
        break;
    }
    
    setFilterPeriod(period);
  };

  return (
    <div className="bg-white p-6 rounded-lg border mb-8">
      <h2 className="text-xl font-semibold mb-4">
        {isApproval ? t('filter_pending_entries') : t('filter_reports')}
      </h2>
      
      <div className={`grid grid-cols-1 ${isApproval ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4 mb-6`}>
        {!isApproval && (
          <div>
            <label className="block text-sm font-medium mb-2">{t('project')}</label>
            <ProjectSelect 
              value={selectedProject} 
              onChange={handleProjectSelect} 
            />
          </div>
        )}
        
        {isApproval && setSelectedUser && (
          <div>
            <label className="block text-sm font-medium mb-2">{t('user')}</label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-reportronic-500 focus:ring-reportronic-500"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="all">{t('all_users')}</option>
              {users?.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name || t('unnamed_user')}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('date_range')}</label>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                      </>
                    ) : (
                      format(dateRange.from, "PPP")
                    )
                  ) : (
                    <span>{t('select_date_range')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range as DateRange);
                    if (range?.from) setFilterPeriod("custom");
                  }}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className={isApproval ? "" : "lg:col-span-2"}>
          <label className="block text-sm font-medium mb-2">{t('quick_filters')}</label>
          <div className="flex flex-wrap gap-2">
            {!isApproval && (
              <Button 
                variant={filterPeriod === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDateFilter("week")}
              >
                {t('this_week')}
              </Button>
            )}
            <Button 
              variant={filterPeriod === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => applyDateFilter("month")}
            >
              {t('this_month')}
            </Button>
            <Button 
              variant={filterPeriod === "last-month" ? "default" : "outline"}
              size="sm"
              onClick={() => applyDateFilter("last-month")}
            >
              {t('last_month')}
            </Button>
            {!isApproval && (
              <Button 
                variant={filterPeriod === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => applyDateFilter("all")}
              >
                {t('all_time')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
