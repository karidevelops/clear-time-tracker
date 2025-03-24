
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEnvOrThrow } from "./utils.ts";

export interface TimeEntry {
  date: string;
  hours: number;
  description: string;
  status: string;
  project: string;
  client: string;
}

export interface WeeklySummary {
  totalHours: number;
  projectHours: Record<string, number>;
  clientHours: Record<string, number>;
  dailyHours: Record<string, number>;
  weekRange: string;
}

export async function fetchTimeEntries(userId: string): Promise<{
  entries: TimeEntry[] | null;
  summary: WeeklySummary | null;
}> {
  // Get Supabase credentials from environment
  const supabaseUrl = getEnvOrThrow('SUPABASE_URL');
  const supabaseKey = getEnvOrThrow('SUPABASE_ANON_KEY');
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase key starting with:', supabaseKey.substring(0, 5) + '...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Fetching time entries for user:', userId);
  
  // Get current date and calculate start/end of current week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
  endOfWeek.setHours(23, 59, 59, 999);
  
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];
  
  console.log(`Fetching entries between ${startDate} and ${endDate}`);
  
  try {
    // Fetch time entries for the current week
    const { data: entries, error } = await supabase
      .from('time_entries')
      .select(`
        id, 
        date, 
        hours, 
        description, 
        status,
        project_id,
        projects(name, client_id, clients(name))
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching time entries:', error);
      throw error;
    }
    
    console.log(`Found ${entries?.length || 0} time entries`);
    console.log('Sample entries:', JSON.stringify(entries?.slice(0, 2)));
    
    if (!entries || entries.length === 0) {
      console.log('No time entries found for the current week');
      return { entries: null, summary: null };
    }
    
    // Format entries for better readability
    const timeEntriesData = entries.map(entry => ({
      date: entry.date,
      hours: Number(entry.hours),
      description: entry.description || "Ei kuvausta",
      status: entry.status,
      project: entry.projects?.name || "Tuntematon projekti",
      client: entry.projects?.clients?.name || "Tuntematon asiakas"
    }));
    
    // Calculate weekly summary
    const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    
    // Group by project
    const projectHours = entries.reduce((acc, entry) => {
      const projectName = entry.projects?.name || "Tuntematon projekti";
      acc[projectName] = (acc[projectName] || 0) + Number(entry.hours);
      return acc;
    }, {} as Record<string, number>);
    
    // Group by client
    const clientHours = entries.reduce((acc, entry) => {
      const clientName = entry.projects?.clients?.name || "Tuntematon asiakas";
      acc[clientName] = (acc[clientName] || 0) + Number(entry.hours);
      return acc;
    }, {} as Record<string, number>);
    
    // Group by day of week
    const dayHours = entries.reduce((acc, entry) => {
      acc[entry.date] = (acc[entry.date] || 0) + Number(entry.hours);
      return acc;
    }, {} as Record<string, number>);
    
    const weeklyHoursSummary = {
      totalHours,
      projectHours,
      clientHours,
      dailyHours: dayHours,
      weekRange: `${startDate} - ${endDate}`
    };
    
    console.log('Weekly summary calculated:', JSON.stringify(weeklyHoursSummary));
    
    return { 
      entries: timeEntriesData,
      summary: weeklyHoursSummary
    };
  } catch (error) {
    console.error('Error in fetchTimeEntries:', error);
    throw error;
  }
}
