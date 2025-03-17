import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BarChart3, Calendar, PieChart, ArrowUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useLanguage } from '@/context/LanguageContext';
import TimeEntry from '@/components/TimeEntry';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, startOfToday, startOfWeek, startOfMonth, endOfWeek, endOfMonth, parseISO } from 'date-fns';
import TodayEntries from '@/components/TodayEntries';
import HoursCharts from '@/components/HoursCharts';

const DAILY_TARGET_HOURS = 7.5;
const WEEKLY_TARGET_HOURS = 37.5;

const projects = [
  { id: '1', name: 'Website Development', hours: 48.5, color: 'bg-blue-500' },
  { id: '2', name: 'Mobile App', hours: 37, color: 'bg-green-500' },
  { id: '3', name: 'Backend API', hours: 23.5, color: 'bg-purple-500' },
  { id: '4', name: 'UI/UX Design', hours: 18, color: 'bg-orange-500' },
  { id: '5', name: 'Documentation', hours: 15, color: 'bg-red-500' },
];

const Index = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    weeklyAverage: 0,
    previousWeeklyAverage: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    }
  }, [user]);

  const handleTimeEntrySaved = () => {
    fetchStats();
  };
  
  // Function to calculate if there's growth compared to previous period
  const isGrowing = stats.weeklyAverage > stats.previousWeeklyAverage;
  
  // Calculate percentage change for weekly average
  const percentChange = stats.previousWeeklyAverage > 0 
    ? Math.abs(((stats.weeklyAverage - stats.previousWeeklyAverage) / stats.previousWeeklyAverage) * 100).toFixed(1) 
    : "0.0";

  async function fetchStats() {
    if (!user?.id) return;
    
    const userId = user.id;
    const today = startOfToday();
    const weekStart = startOfWeek(today);
    const monthStart = startOfMonth(today);
    
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const monthStartStr = format(monthStart, 'yyyy-MM-dd');
    
    // Get today's hours
    const { data: todayData, error: todayError } = await supabase
      .from('time_entries')
      .select('hours')
      .eq('user_id', userId)
      .eq('date', todayStr);
    
    // Get this week's hours
    const { data: weekData, error: weekError } = await supabase
      .from('time_entries')
      .select('hours')
      .eq('user_id', userId)
      .gte('date', weekStartStr)
      .lte('date', format(endOfWeek(today), 'yyyy-MM-dd'));
    
    // Get this month's hours
    const { data: monthData, error: monthError } = await supabase
      .from('time_entries')
      .select('hours')
      .eq('user_id', userId)
      .gte('date', monthStartStr)
      .lte('date', format(endOfMonth(today), 'yyyy-MM-dd'));
    
    // Get previous month's hours for comparison
    const prevMonthStart = startOfMonth(new Date(today.getFullYear(), today.getMonth() - 1));
    const prevMonthEnd = endOfMonth(new Date(today.getFullYear(), today.getMonth() - 1));
    
    const { data: prevMonthData, error: prevMonthError } = await supabase
      .from('time_entries')
      .select('hours')
      .eq('user_id', userId)
      .gte('date', format(prevMonthStart, 'yyyy-MM-dd'))
      .lte('date', format(prevMonthEnd, 'yyyy-MM-dd'));
    
    if (todayError || weekError || monthError || prevMonthError) {
      console.error('Error fetching stats:', todayError || weekError || monthError || prevMonthError);
      return;
    }
    
    const todayHours = todayData?.reduce((sum, entry) => sum + entry.hours, 0) || 0;
    const weekHours = weekData?.reduce((sum, entry) => sum + entry.hours, 0) || 0;
    const monthHours = monthData?.reduce((sum, entry) => sum + entry.hours, 0) || 0;
    
    const currentWeeklyAvg = monthHours / 4; // Simplified weekly average
    const prevMonthHours = prevMonthData?.reduce((sum, entry) => sum + entry.hours, 0) || 0;
    const prevWeeklyAvg = prevMonthHours / 4;
    
    setStats({
      today: todayHours,
      week: weekHours,
      month: monthHours,
      weeklyAverage: currentWeeklyAvg,
      previousWeeklyAverage: prevWeeklyAvg
    });
    
    setIsLoading(false);
  }

  return (
    <Layout>
      <div className="py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-reportronic-800">{t('dashboard')}</h1>
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-reportronic-50 border-b">
            <CardTitle className="flex items-center text-reportronic-800">
              <Clock className="mr-2 h-5 w-5 text-reportronic-500" />
              {t('log_time')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <TimeEntry onEntrySaved={handleTimeEntrySaved} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{t('today')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">{stats.today.toFixed(1)}h</div>
                <Clock className="h-8 w-8 text-reportronic-500" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t('target')}: {DAILY_TARGET_HOURS}h
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-reportronic-600 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (stats.today / DAILY_TARGET_HOURS) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{t('this_week')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">{stats.week.toFixed(1)}h</div>
                <Calendar className="h-8 w-8 text-reportronic-500" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t('target')}: {WEEKLY_TARGET_HOURS}h
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-reportronic-600 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (stats.week / WEEKLY_TARGET_HOURS) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{t('this_month')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">{stats.month.toFixed(1)}h</div>
                <BarChart3 className="h-8 w-8 text-reportronic-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{t('weekly_average')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">
                  {stats.weeklyAverage.toFixed(1)}h
                  {stats.previousWeeklyAverage > 0 && (
                    <span className={`ml-1 text-xs font-normal flex items-center ${isGrowing ? 'text-green-600' : 'text-red-600'}`}>
                      {isGrowing ? <ArrowUp className="h-3 w-3" /> : <ArrowUp className="h-3 w-3 transform rotate-180" />} {percentChange}%
                    </span>
                  )}
                </div>
                <PieChart className="h-8 w-8 text-reportronic-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <TodayEntries 
              onEntrySaved={handleTimeEntrySaved} 
              onEntryDeleted={() => fetchStats()}
            />
          </div>
        </div>
        
        <HoursCharts />
      </div>
    </Layout>
  );
};

export default Index;
