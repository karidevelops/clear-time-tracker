import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "date-fns";
import { fi, sv, enUS } from 'date-fns/locale';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export type FilterPeriod = "all" | "today" | "week" | "month" | "year" | "custom";

interface FilterSectionProps {
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  filterPeriod: FilterPeriod;
  setFilterPeriod: React.Dispatch<React.SetStateAction<FilterPeriod>>;
  selectedClient: string;
  setSelectedClient: React.Dispatch<React.SetStateAction<string>>;
  selectedProject: string;
  setSelectedProject: React.Dispatch<React.SetStateAction<string>>;
  clients: { id: string; name: string }[];
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
  const { t, language } = useLanguage();
  
  // Get date-fns locale based on current language
  const getLocale = () => {
    switch (language) {
      case 'fi':
        return fi;
      case 'sv':
        return sv;
      default:
        return enUS;
    }
  };
  
  // Set date range based on period selection
  const handlePeriodChange = (value: string) => {
    const period = value as FilterPeriod;
    setFilterPeriod(period);
    
    const today = new Date();
    let from: Date | undefined = undefined;
    let to: Date | undefined = undefined;
    
    switch (period) {
      case "today":
        from = today;
        to = today;
        break;
      case "week":
        from = new Date(today);
        from.setDate(today.getDate() - today.getDay());
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        break;
      case "month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "year":
        from = new Date(today.getFullYear(), 0, 1);
        to = new Date(today.getFullYear(), 11, 31);
        break;
      case "all":
        from = undefined;
        to = undefined;
        break;
      default:
        // Keep current date range for custom
        break;
    }
    
    setDateRange({ from, to });
  };
  
  return (
    <div className="bg-white p-6 rounded-lg border mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Time Period Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('time_period')}
          </label>
          <Select
            value={filterPeriod}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('select_time_period')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_time')}</SelectItem>
              <SelectItem value="today">{t('today')}</SelectItem>
              <SelectItem value="week">{t('this_week')}</SelectItem>
              <SelectItem value="month">{t('this_month')}</SelectItem>
              <SelectItem value="year">{t('this_year')}</SelectItem>
              <SelectItem value="custom">{t('custom_range')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Custom Date Range */}
        {filterPeriod === "custom" && (
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('date_range')}
            </label>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      format(dateRange.from, "PPP", { locale: getLocale() })
                    ) : (
                      <span>{t('start_date')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    initialFocus
                    locale={getLocale()}
                  />
                </PopoverContent>
              </Popover>
              
              <ArrowRight className="h-4 w-4 text-gray-500" />
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? (
                      format(dateRange.to, "PPP", { locale: getLocale() })
                    ) : (
                      <span>{t('end_date')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    initialFocus
                    locale={getLocale()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
        
        {/* Client Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('client')}
          </label>
          <Select
            value={selectedClient}
            onValueChange={setSelectedClient}
            disabled={isLoadingClients}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('all_clients')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_clients')}</SelectItem>
              {clients && clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Project Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('project')}
          </label>
          <Select
            value={selectedProject}
            onValueChange={setSelectedProject}
            disabled={isLoadingProjects}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('all_projects')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_projects')}</SelectItem>
              {/* Projects are shown based on selected client in Reports.tsx */}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
