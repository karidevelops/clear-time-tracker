
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fi, sv, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeEntry } from "@/types/timeEntry";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Reports = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  // Set default date range to current month
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));
  
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
  
  // Fetch time entries for the selected date range
  const { data: timeEntries, isLoading, refetch } = useQuery({
    queryKey: ['reportTimeEntries', fromDate, toDate, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('*, projects(name, client_id), projects!inner(clients(name))')
        .eq('user_id', user.id)
        .gte('date', format(fromDate, 'yyyy-MM-dd'))
        .lte('date', format(toDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching time entries:', error);
        throw new Error(t('error_fetching_entries'));
      }
      
      return data || [];
    },
    enabled: !!user,
  });
  
  // Calculate total hours for the report
  const totalHours = timeEntries?.reduce((sum, entry) => sum + Number(entry.hours), 0) || 0;
  
  // Function to handle search button click
  const handleSearch = () => {
    refetch();
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('reports')}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('generate_report')}</CardTitle>
          <CardDescription>{t('time_period')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <div className="text-sm font-medium">{t('from_date')}</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fromDate, "PPP", { locale: getLocale() })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={(date) => date && setFromDate(date)}
                    initialFocus
                    locale={getLocale()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">{t('to_date')}</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(toDate, "PPP", { locale: getLocale() })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={(date) => date && setToDate(date)}
                    initialFocus
                    locale={getLocale()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button onClick={handleSearch} className="mt-4 sm:mt-0">
              <Search className="mr-2 h-4 w-4" />
              {t('generate_report')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div>{t('loading')}...</div>
        </div>
      ) : timeEntries && timeEntries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('total_hours')}: {totalHours.toFixed(2)}</CardTitle>
            <CardDescription>
              {format(fromDate, "PPP", { locale: getLocale() })} - {format(toDate, "PPP", { locale: getLocale() })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('hours')}</TableHead>
                  <TableHead>{t('project')}</TableHead>
                  <TableHead>{t('client')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.date), "PPP", { locale: getLocale() })}</TableCell>
                    <TableCell>{entry.hours}</TableCell>
                    <TableCell>{entry.projects?.name || t('unknown_client')}</TableCell>
                    <TableCell>{entry.projects?.clients?.name || t('unknown_client')}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description || '-'}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        entry.status === "approved" ? "bg-green-100 text-green-800" :
                        entry.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      )}>
                        {t(entry.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p>{t('no_data_available')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
