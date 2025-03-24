
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
      // Fetch time entries from database
      const { entries, summary } = await fetchTimeEntries(userId);
      timeEntriesData = entries;
      weeklyHoursSummary = summary;
    } catch (dbError) {
      console.error('Error during database query:', dbError);
      console.error('Stack trace:', dbError.stack);
      // Continue with the OpenAI request even if DB fetch fails
    }
  }
  
  // Log app data info
  console.log('App data received:', {
    clientsCount: appData?.clients?.length || 0,
    projectsCount: appData?.projects?.length || 0
  });
  
  if (appData?.clients?.length > 0) {
    console.log('First client:', appData.clients[0]);
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
