import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectSelect from "@/components/ProjectSelect";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export type FilterPeriod = "all" | "week" | "month" | "last-month" | "custom";

interface Client {
  id: string;
  name: string;
}

interface FilterSectionProps {
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  filterPeriod: FilterPeriod;
  setFilterPeriod: React.Dispatch<React.SetStateAction<FilterPeriod>>;
  selectedClient: string;
  setSelectedClient: React.Dispatch<React.SetStateAction<string>>;
  selectedProject: string;
  setSelectedProject: React.Dispatch<React.SetStateAction<string>>;
  clients: Client[];
  isLoadingClients: boolean;
  isLoadingProjects: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  dateRange,
  setDateRange,
  filterPeriod,
  setFilterPeriod,
  selectedClient,
  setSelectedClient,
  selectedProject,
  setSelectedProject,
  clients,
  isLoadingClients,
  isLoadingProjects,
}) => {
  const { t } = useLanguage();

  // Reset selected project when client changes
  useEffect(() => {
    setSelectedProject("");
  }, [selectedClient, setSelectedProject]);

  // Apply date range filters based on selected period
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
      // When custom is selected, we keep the existing range if it exists
      case "custom":
        break;
    }
    
    setFilterPeriod(period);
  };

  return (
    <div className="bg-white p-6 rounded-lg border mb-8">
      <h2 className="text-xl font-semibold mb-4">{t('filter_reports')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Client filter */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('client')}</label>
          {isLoadingClients ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div>
              <Select 
                value={selectedClient} 
                onValueChange={setSelectedClient}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('select_client')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('all_clients')}</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Project filter */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('project')}</label>
          {isLoadingProjects ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <ProjectSelect 
              value={selectedProject} 
              onChange={setSelectedProject} 
              clientId={selectedClient}
            />
          )}
        </div>
        
        {/* Date range filter */}
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
        
        {/* Quick date filters */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium mb-2">{t('quick_filters')}</label>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filterPeriod === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => applyDateFilter("week")}
            >
              {t('this_week')}
            </Button>
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
            <Button 
              variant={filterPeriod === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => applyDateFilter("all")}
            >
              {t('all_time')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
