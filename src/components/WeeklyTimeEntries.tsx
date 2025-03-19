import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, getWeek, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { fi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { TimeEntry } from '@/types/timeEntry';
import { supabase } from '@/integrations/supabase/client';
import { getAllProjects, getProjectById } from '@/data/ClientsData';

interface WeeklyTimeEntriesProps {
  timeEntries: TimeEntry[];
  title?: string;
}

interface WeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  entries: TimeEntry[];
  totalHours: number;
  isExpanded: boolean;
}

interface ProjectInfo {
  [key: string]: { name: string; clientName: string };
}

const WeeklyTimeEntries: React.FC<WeeklyTimeEntriesProps> = ({ 
  timeEntries, 
  title = 'Viikottaiset tunnit' // Default title in Finnish
}) => {
  const { t } = useLanguage();
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
  const [totalMonthHours, setTotalMonthHours] = useState(0);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({});

  useEffect(() => {
    fetchProjectInfo();
  }, []);

  const fetchProjectInfo = async () => {
    try {
      // First try to get from Supabase
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          client_id,
          clients (
            name
          )
        `);

      if (!error && data && data.length > 0) {
        const projectMap: ProjectInfo = {};
        data.forEach(project => {
          projectMap[project.id] = {
            name: project.name,
            clientName: project.clients?.name || 'Unknown Client'
          };
        });
        setProjectInfo(projectMap);
      } else {
        // Fallback to static data
        const projects = getAllProjects();
        const projectMap: ProjectInfo = {};
        projects.forEach(project => {
          const client = project.clientId ? { name: 'Unknown Client' } : null;
          projectMap[project.id] = {
            name: project.name,
            clientName: client?.name || 'Unknown Client'
          };
        });
        setProjectInfo(projectMap);
      }
    } catch (error) {
      console.error('Error fetching project info:', error);
    }
  };

  const getProjectName = (projectId: string) => {
    return projectInfo[projectId]?.name || projectId;
  };

  const getClientName = (projectId: string) => {
    return projectInfo[projectId]?.clientName || '';
  };

  useEffect(() => {
    if (!timeEntries || timeEntries.length === 0) return;

    // Group entries by week
    const entriesByWeek = new Map<number, TimeEntry[]>();
    
    timeEntries.forEach(entry => {
      if (!entry.date) return;
      
      const entryDate = parseISO(entry.date);
      const weekStart = startOfWeek(entryDate, { weekStartsOn: 1 });
      const weekNumber = getWeek(entryDate, { weekStartsOn: 1 });
      
      if (!entriesByWeek.has(weekNumber)) {
        entriesByWeek.set(weekNumber, []);
      }
      
      entriesByWeek.get(weekNumber)?.push(entry);
    });
    
    // Convert to array and sort by week
    const weeks: WeekData[] = [];
    
    entriesByWeek.forEach((entries, weekNumber) => {
      if (entries.length === 0) return;
      
      // Get the first entry's date to calculate the week's start/end
      const firstEntry = entries[0];
      const firstDate = parseISO(firstEntry.date);
      const weekStart = startOfWeek(firstDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(firstDate, { weekStartsOn: 1 });
      
      // Calculate total hours for the week
      const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
      
      weeks.push({
        weekNumber,
        startDate: weekStart,
        endDate: weekEnd,
        entries: entries.sort((a, b) => a.date.localeCompare(b.date)), // Sort by date
        totalHours,
        isExpanded: false
      });
    });
    
    // Sort weeks by start date (descending)
    weeks.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    
    // Calculate total hours for all weeks
    const totalHours = weeks.reduce((sum, week) => sum + week.totalHours, 0);
    
    setWeeklyData(weeks);
    setTotalMonthHours(totalHours);
    
  }, [timeEntries]);

  const toggleWeekExpanded = (weekIndex: number) => {
    setWeeklyData(prevData => 
      prevData.map((week, index) => 
        index === weekIndex ? { ...week, isExpanded: !week.isExpanded } : week
      )
    );
  };

  const formatWeekRange = (start: Date, end: Date) => {
    return `${format(start, 'd.M')} - ${format(end, 'd.M.yyyy')}`;
  };

  if (!weeklyData || weeklyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">Ei aikakirjauksia</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <div className="text-sm font-medium">
            Yhteensä: <span className="text-reportronic-600">{totalMonthHours.toFixed(1)}h</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {weeklyData.map((week, weekIndex) => (
            <div key={`week-${week.weekNumber}`} className="py-2">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleWeekExpanded(weekIndex)}
              >
                <div className="flex items-center">
                  {week.isExpanded ? 
                    <ChevronUp className="h-4 w-4 mr-2 text-reportronic-500" /> : 
                    <ChevronDown className="h-4 w-4 mr-2 text-reportronic-500" />
                  }
                  <div>
                    <span className="font-medium">Viikko {week.weekNumber}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {formatWeekRange(week.startDate, week.endDate)}
                    </span>
                  </div>
                </div>
                <div className="text-reportronic-600 font-medium">
                  {week.totalHours.toFixed(1)}h
                </div>
              </div>
              
              {week.isExpanded && (
                <div className="px-4 pb-4 pt-2">
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 px-3 text-left font-medium text-gray-500">Päivämäärä</th>
                          <th className="py-2 px-3 text-left font-medium text-gray-500">Asiakas</th>
                          <th className="py-2 px-3 text-left font-medium text-gray-500">Projekti</th>
                          <th className="py-2 px-3 text-left font-medium text-gray-500">Kuvaus</th>
                          <th className="py-2 px-3 text-right font-medium text-gray-500">Tunnit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {week.entries.map(entry => (
                          <tr key={entry.id} className="hover:bg-gray-100">
                            <td className="py-2 px-3">{format(parseISO(entry.date), 'EEE d.M', { locale: fi })}</td>
                            <td className="py-2 px-3">{getClientName(entry.project_id)}</td>
                            <td className="py-2 px-3">{getProjectName(entry.project_id)}</td>
                            <td className="py-2 px-3">{entry.description || "-"}</td>
                            <td className="py-2 px-3 text-right">{Number(entry.hours).toFixed(1)}h</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100">
                          <td colSpan={4} className="py-2 px-3 text-right font-medium">Yhteensä:</td>
                          <td className="py-2 px-3 text-right font-medium text-reportronic-600">{week.totalHours.toFixed(1)}h</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyTimeEntries;
