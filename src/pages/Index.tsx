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
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    weeklyAverage: 0,
    previousWeeklyAverage: 0
  });

  useEffect(() => {
    async function fetchRecentEntries() {
      try {
        const userId = user?.id || '00000000-0000-0000-0000-000000000000';
        
        setIsLoading(true);
        const { data, error } = await supabase
          .from('time_entries')
          .select(`
            id,
            date,
            hours,
            description,
            project_id,
            projects (
              name,
              client_id,
              clients (
                name
              )
            )
          `)
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching time entries:', error);
          return;
        }

        const mappedEntries = data.map(entry => ({
          id: entry.id,
          date: entry.date,
          hours: entry.hours,
          description: entry.description,
          project: entry.projects?.name || 'Unknown Project',
          client: entry.projects?.clients?.name || 'Unknown Client'
        }));

        setRecentEntries(mappedEntries);
      } catch (error) {
        console.error('Exception fetching time entries:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentEntries();
  }, [user]);

  useEffect(() => {
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
      
      // Calculate percentage change
      const percentChange = prevWeeklyAvg > 0 
        ? ((currentWeeklyAvg - prevWeeklyAvg) / prevWeeklyAvg) * 100 
        : 0;
      
      setStats({
        today: todayHours,
        week: weekHours,
        month: monthHours,
        weeklyAverage: currentWeeklyAvg,
        previousWeeklyAverage: prevWeeklyAvg
      });
    }
    
    fetchStats();
  }, [user]);

  const handleTimeEntrySaved = (newEntry: any) => {
    async function fetchEntryDetails() {
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select(`
            id,
            date,
            hours,
            description,
            project_id,
            projects (
              name,
              client_id,
              clients (
                name
              )
            )
          `)
          .eq('id', newEntry.id)
          .single();

        if (error) {
          console.error('Error fetching entry details:', error);
          return;
        }

        setRecentEntries([
          {
            id: data.id,
            date: data.date,
            hours: data.hours,
            description: data.description,
            project: data.projects?.name || 'Unknown Project',
            client: data.projects?.clients?.name || 'Unknown Client'
          },
          ...recentEntries
        ]);
        
        // Refresh stats after new entry
        fetchStats();
      } catch (error) {
        console.error('Exception fetching entry details:', error);
      }
    }

    fetchEntryDetails();
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <TodayEntries 
              onEntrySaved={handleTimeEntrySaved} 
              onEntryDeleted={() => fetchStats()}
            />
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-reportronic-800">{t('recent_time_entries')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">{t('loading')}...</div>
                ) : recentEntries.length > 0 ? (
                  <div className="divide-y">
                    {recentEntries.map((entry) => (
                      <div key={entry.id} className="flex justify-between items-center p-4 hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium">{entry.client}: {entry.project}</div>
                          <div className="text-sm text-gray-500 mt-1">{entry.date}</div>
                          {entry.description && (
                            <div className="text-sm text-gray-700 mt-1">{entry.description}</div>
                          )}
                        </div>
                        <div className="text-reportronic-700 font-medium ml-4">{entry.hours}h</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {t('no_recent_entries') || 'No recent time entries found. Add a new entry above.'}
                  </div>
                )}
                <div className="p-4 text-center">
                  <Link to="/weekly">
                    <Button variant="ghost" className="text-reportronic-600 hover:text-reportronic-700">
                      {t('view_all_entries')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-lg font-semibold text-reportronic-800">{t('hours_by_project')}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm font-medium truncate max-w-[70%]">{project.name}</div>
                        <div className="text-sm text-gray-500">{project.hours}h</div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`${project.color} h-2 rounded-full`} 
                          style={{ width: `${(project.hours / stats.month) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
