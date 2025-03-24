
import { corsHeaders, isHoursQuery } from "./utils.ts";
import { fetchTimeEntries } from "./database.ts";
import { AppData, Message, prepareSystemMessages } from "./messages.ts";
import { callOpenAI } from "./openai.ts";

export async function handleChatRequest(req: Request) {
  const { messages, userId, appData } = await req.json();
  
  if (!messages || !Array.isArray(messages)) {
    throw new Error('Messages array is required');
  }

  console.log('Request messages length:', messages.length);
  console.log('First few characters of first message:', 
    messages[0]?.content ? messages[0].content.substring(0, 20) + '...' : 'No content');
  
  // Get the last user message in any language
  const lastUserMessage = messages.findLast(m => m.role === 'user')?.content?.toLowerCase() || '';
  console.log('Last user message:', lastUserMessage);
  
  // Detect if this is a hours query
  const isHoursRequest = isHoursQuery(lastUserMessage);
  
  console.log('Is hours query:', isHoursRequest);
  console.log('User ID provided:', userId);
  
  // Initialize time entries data variables
  let timeEntriesData = null;
  let weeklyHoursSummary = null;
  
  if (isHoursRequest && userId) {
    try {
      console.log('Fetching time entries for user ID:', userId);
      // Fetch time entries from database
      const { entries, summary } = await fetchTimeEntries(userId);
      
      // Log the results
      console.log('Time entries fetched:', entries ? entries.length : 0);
      console.log('Weekly summary:', summary);
      
      if (entries && entries.length > 0) {
        timeEntriesData = entries;
        weeklyHoursSummary = summary;
        console.log('Time entry data processed successfully');
      } else {
        console.log('No time entries found for this user');
      }
    } catch (dbError) {
      console.error('Error during database query:', dbError);
      console.error('Stack trace:', dbError.stack);
      // Continue with the OpenAI request even if DB fetch fails
    }
  }
  
  // Detailed logging of app data and client/project information
  console.log('App data received:', {
    clientsCount: appData?.clients?.length || 0,
    projectsCount: appData?.projects?.length || 0
  });
  
  if (appData?.clients?.length > 0) {
    console.log('All clients:', appData.clients.map(c => `${c.name} (ID: ${c.id})`));
    
    // Log all projects
    console.log('All projects:', appData.projects?.map(p => 
      `${p.name} (ID: ${p.id}, Client ID: ${p.client_id})`
    ) || 'No projects data');
    
    // Find and log Sebitti client and its projects specifically
    const sebittiClient = appData.clients.find(
      c => c.name.toLowerCase().includes('sebitti')
    );
    
    if (sebittiClient) {
      console.log('Sebitti client found:', sebittiClient);
      
      // Find projects for Sebitti
      const sebittiProjects = appData.projects?.filter(
        p => p.client_id === sebittiClient.id
      ) || [];
      
      console.log(`Projects for client ${sebittiClient.name}:`, 
        sebittiProjects.length > 0 ? sebittiProjects : "No projects found");
    } else {
      console.log("Sebitti client not found in appData");
    }
    
    // Log specific client if mentioned in the message
    const clientMentioned = appData.clients.find(
      c => lastUserMessage.includes(c.name.toLowerCase())
    );
    
    if (clientMentioned) {
      console.log('Client mentioned in message:', clientMentioned);
      
      // Find projects for this client
      const clientProjects = appData.projects?.filter(
        p => p.client_id === clientMentioned.id
      ) || [];
      
      console.log(`Projects for client ${clientMentioned.name}:`, 
        clientProjects.length > 0 ? clientProjects : "No projects found");
    }
  }
  
  // Prepare system messages based on the request type
  const messagesWithSystem = prepareSystemMessages(
    messages,
    lastUserMessage,
    timeEntriesData,
    weeklyHoursSummary,
    appData as AppData
  );
  
  // Call OpenAI API
  const aiResponse = await callOpenAI(messagesWithSystem);
  
  return new Response(JSON.stringify({ 
    response: aiResponse,
    hasTimeEntryData: timeEntriesData !== null && timeEntriesData.length > 0,
    summary: weeklyHoursSummary
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
