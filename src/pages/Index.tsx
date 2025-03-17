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

const DAILY_TARGET_HOURS = 7.5;
const WEEKLY_TARGET_HOURS = 37.5;

const hours = {
  today: 6.5,
  week: 32.5,
  month: 142,
  target: WEEKLY_TARGET_HOURS
};

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
            project: data.projects?.name || 'Unknown Project',
            client: data.projects?.clients?.name || 'Unknown Client'
          },
          ...recentEntries
        ]);
      } catch (error) {
        console.error('Exception fetching entry details:', error);
      }
    }

    fetchEntryDetails();
  };

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
                <div className="text-2xl font-bold">{hours.today}h</div>
                <Clock className="h-8 w-8 text-reportronic-500" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t('target')}: {DAILY_TARGET_HOURS}h
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-reportronic-600 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (hours.today / DAILY_TARGET_HOURS) * 100)}%` }}
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
                <div className="text-2xl font-bold">{hours.week}h</div>
                <Calendar className="h-8 w-8 text-reportronic-500" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t('target')}: {hours.target}h
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-reportronic-600 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (hours.week / hours.target) * 100)}%` }}
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
                <div className="text-2xl font-bold">{hours.month}h</div>
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
                  {(hours.month / 4).toFixed(1)}h
                  <span className="ml-1 text-xs font-normal text-green-600 flex items-center">
                    <ArrowUp className="h-3 w-3" /> 3.2%
                  </span>
                </div>
                <PieChart className="h-8 w-8 text-reportronic-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4 border-b">
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
                          style={{ width: `${(project.hours / hours.month) * 100}%` }}
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
