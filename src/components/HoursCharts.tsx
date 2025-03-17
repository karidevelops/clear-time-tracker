
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getAllProjects, getClientById } from '@/data/ClientsData';

// Custom colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

type TimeEntryWithProject = {
  hours: number;
  project_id: string;
  project: {
    name: string;
    client_id: string;
  };
};

type ClientHours = {
  id: string;
  name: string;
  hours: number;
};

type ProjectHours = {
  id: string;
  name: string;
  hours: number;
};

const HoursCharts = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [clientHours, setClientHours] = useState<ClientHours[]>([]);
  const [projectHours, setProjectHours] = useState<ProjectHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTimeEntriesWithProjects();
    }
  }, [user]);

  const fetchTimeEntriesWithProjects = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // Get time entries with project information
      const { data: timeEntries, error } = await supabase
        .from('time_entries')
        .select(`
          hours,
          project_id,
          projects(name, client_id)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching time entries:', error);
        return;
      }

      if (!timeEntries) {
        setIsLoading(false);
        return;
      }

      // Process data for client hours
      const clientsMap = new Map<string, number>();
      const projectsMap = new Map<string, number>();
      
      // Format the data to match the expected structure
      const formattedEntries = timeEntries.map(entry => ({
        hours: entry.hours,
        project_id: entry.project_id,
        project: entry.projects
      })) as TimeEntryWithProject[];

      // Calculate hours per client and project
      formattedEntries.forEach(entry => {
        // For project hours
        if (projectsMap.has(entry.project_id)) {
          projectsMap.set(entry.project_id, projectsMap.get(entry.project_id)! + entry.hours);
        } else {
          projectsMap.set(entry.project_id, entry.hours);
        }

        // For client hours
        const clientId = entry.project.client_id;
        if (clientId) {
          if (clientsMap.has(clientId)) {
            clientsMap.set(clientId, clientsMap.get(clientId)! + entry.hours);
          } else {
            clientsMap.set(clientId, entry.hours);
          }
        }
      });

      // Convert Maps to arrays for the charts
      const clientsArray: ClientHours[] = [];
      clientsMap.forEach((hours, id) => {
        const client = getClientById(id);
        if (client) {
          clientsArray.push({
            id,
            name: client.name,
            hours
          });
        }
      });

      const projectsArray: ProjectHours[] = [];
      projectsMap.forEach((hours, id) => {
        const projects = getAllProjects();
        const project = projects.find(p => p.id === id);
        if (project) {
          projectsArray.push({
            id,
            name: project.name,
            hours
          });
        }
      });

      setClientHours(clientsArray);
      setProjectHours(projectsArray);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing time entries:', error);
      setIsLoading(false);
    }
  };

  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{`${payload[0].value.toFixed(1)} ${t('hours')}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold text-reportronic-800">{t('hours_by_client')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>{t('loading')}...</p>
            </div>
          ) : clientHours.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p>{t('no_data')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clientHours}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                  nameKey="name"
                >
                  {clientHours.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold text-reportronic-800">{t('hours_by_project')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>{t('loading')}...</p>
            </div>
          ) : projectHours.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p>{t('no_data')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectHours}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                  nameKey="name"
                >
                  {projectHours.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HoursCharts;
