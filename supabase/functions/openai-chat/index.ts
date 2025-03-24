
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    // Get the API key from environment
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    
    console.log('Making request to OpenAI API...');
    console.log('Using API key starting with:', apiKey.substring(0, 5) + '...');
    console.log('Request messages length:', messages.length);
    console.log('First few characters of first message:', 
      messages[0]?.content ? messages[0].content.substring(0, 20) + '...' : 'No content');
    
    // Get the last user message in any language
    const lastUserMessage = messages.findLast(m => m.role === 'user')?.content?.toLowerCase() || '';
    console.log('Last user message:', lastUserMessage);
    
    // Detect UI customization requests in multiple languages - enhanced detection
    const isColorChangeRequest = 
      (lastUserMessage.includes('change') && lastUserMessage.includes('color')) || 
      (lastUserMessage.includes('muuta') && lastUserMessage.includes('väri')) || 
      (lastUserMessage.includes('vaihda') && lastUserMessage.includes('väri')) || 
      (lastUserMessage.includes('ändra') && lastUserMessage.includes('färg'));
    
    // Detect hour-related queries in multiple languages
    const isHoursQuery = 
      (lastUserMessage.includes('hour') || lastUserMessage.includes('time')) || 
      (lastUserMessage.includes('tunti') || lastUserMessage.includes('aika')) || 
      (lastUserMessage.includes('selvitä') && lastUserMessage.includes('tunnit')) ||
      (lastUserMessage.includes('paljonko') && lastUserMessage.includes('tunti')) ||
      (lastUserMessage.includes('montako') && lastUserMessage.includes('tunti'));
    
    console.log('Is color change request:', isColorChangeRequest);
    console.log('Is hours query:', isHoursQuery);
    console.log('User ID provided:', userId);
    
    // Initialize Supabase client
    let timeEntriesData = null;
    let weeklyHoursSummary = null;
    
    if (isHoursQuery && userId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
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
        
        if (entries && entries.length > 0) {
          // Format entries for better readability
          timeEntriesData = entries.map(entry => ({
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
          }, {});
          
          // Group by client
          const clientHours = entries.reduce((acc, entry) => {
            const clientName = entry.projects?.clients?.name || "Tuntematon asiakas";
            acc[clientName] = (acc[clientName] || 0) + Number(entry.hours);
            return acc;
          }, {});
          
          // Group by day of week
          const dayHours = entries.reduce((acc, entry) => {
            acc[entry.date] = (acc[entry.date] || 0) + Number(entry.hours);
            return acc;
          }, {});
          
          weeklyHoursSummary = {
            totalHours,
            projectHours,
            clientHours,
            dailyHours: dayHours,
            weekRange: `${startDate} - ${endDate}`
          };
          
          console.log('Weekly summary calculated:', JSON.stringify(weeklyHoursSummary));
        }
      } catch (dbError) {
        console.error('Error during database query:', dbError);
        // Continue with the OpenAI request even if DB fetch fails
      }
    }
    
    // Add system message for UI customization or hours query requests if not already present
    let messagesWithSystem = [...messages];
    
    if (isColorChangeRequest && 
        !messages.some(m => m.role === 'system' && m.content.includes('UI_CUSTOMIZATION'))) {
      
      messagesWithSystem.unshift({
        role: 'system',
        content: `UI_CUSTOMIZATION: If the user wants to change the footer color, include "changeFooterColor(bg-color-class)" in your response where color-class is a valid Tailwind color class (e.g., bg-blue-500, bg-red-600, bg-green-400).

You should recognize these requests in multiple languages:
- English: "change footer color to X"
- Finnish: "muuta alapalkin väri X:ksi", "vaihda alapalkin väri X:ksi"
- Swedish: "ändra sidfotens färg till X"

Respond in the same language as the user's request.
Be VERY explicit and follow EXACTLY this format:
- For colors: changeFooterColor(bg-color-500)`
      });
    }
    
    if (isHoursQuery) {
      let hoursSystemContent = `HOURS_QUERY: You are an AI assistant specialized in helping users query their logged hours in Reportronic.`;
      
      if (timeEntriesData && weeklyHoursSummary) {
        // If we have actual time entry data, provide it to the AI
        hoursSystemContent += `
I have access to the user's time entries for the current week. Here's a summary:

Total hours this week: ${weeklyHoursSummary.totalHours.toFixed(2)} hours
Week period: ${weeklyHoursSummary.weekRange}

Hours by project:
${Object.entries(weeklyHoursSummary.projectHours)
  .map(([project, hours]) => `- ${project}: ${Number(hours).toFixed(2)} hours`)
  .join('\n')}

Hours by client:
${Object.entries(weeklyHoursSummary.clientHours)
  .map(([client, hours]) => `- ${client}: ${Number(hours).toFixed(2)} hours`)
  .join('\n')}

Daily breakdown:
${Object.entries(weeklyHoursSummary.dailyHours)
  .map(([date, hours]) => `- ${date}: ${Number(hours).toFixed(2)} hours`)
  .join('\n')}

Detailed time entries:
${timeEntriesData.map(entry => 
  `- ${entry.date}: ${entry.hours.toFixed(2)} hours on ${entry.project} (${entry.client}): "${entry.description}"`
).join('\n')}`;
      } else {
        // If no data available, use the default response
        hoursSystemContent += `
When users ask about their hours:
1. Explain that you don't have direct access to their specific time entries and data
2. Direct them to check their hours in the weekly view, monthly view, or dashboard
3. Suggest using the built-in reports for a complete overview`;
      }
      
      hoursSystemContent += `
You should recognize these requests in multiple languages:
- English: "show my hours", "how many hours", "check my time entries"
- Finnish: "näytä tuntini", "montako tuntia", "selvitä kirjatut tunnit", "paljonko tunteja"
- Swedish: "visa mina timmar", "hur många timmar"

Respond in the same language as the user's request.`;
      
      // Replace any existing HOURS_QUERY system message or add a new one
      const existingHoursIdx = messagesWithSystem.findIndex(m => 
        m.role === 'system' && m.content.includes('HOURS_QUERY'));
      
      if (existingHoursIdx >= 0) {
        messagesWithSystem[existingHoursIdx] = {
          role: 'system',
          content: hoursSystemContent
        };
      } else {
        messagesWithSystem.unshift({
          role: 'system',
          content: hoursSystemContent
        });
      }
    }
    
    // Make the chat completion request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messagesWithSystem,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });
    
    console.log('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response status:', response.status);
      console.error('OpenAI API error response body:', errorText);
      
      let errorMessage;
      try {
        // Try to parse the error as JSON
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || `API error: ${response.statusText} (${response.status})`;
        console.error('Parsed error message:', errorMessage);
      } catch (e) {
        // If the error isn't valid JSON, use the raw text
        errorMessage = `API error: ${response.statusText} (${response.status}) - ${errorText.substring(0, 100)}`;
        console.error('Error parsing error response:', e.message);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Received response from OpenAI API');
    console.log('Response choice count:', data.choices?.length || 0);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format:', JSON.stringify(data).substring(0, 200));
      throw new Error('Invalid response format from OpenAI API');
    }
    
    const aiResponse = data.choices[0].message.content;
    console.log('AI response preview:', aiResponse.substring(0, 100));
    
    return new Response(JSON.stringify({ 
      response: aiResponse,
      hasTimeEntryData: timeEntriesData !== null && timeEntriesData.length > 0,
      summary: weeklyHoursSummary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in openai-chat function:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
