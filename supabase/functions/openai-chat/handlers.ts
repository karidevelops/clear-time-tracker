
import { corsHeaders, securityHeaders, checkRateLimit, validateChatInput, logSecurityEvent } from "./security.ts";
import { isHoursQuery } from "./utils.ts";
import { fetchTimeEntries } from "./database.ts";
import { AppData, Message, prepareSystemMessages } from "./messages.ts";
import { callOpenAI } from "./openai.ts";

export async function handleChatRequest(req: Request) {
  try {
    // Parse and validate input
    const rawInput = await req.json();
    const validation = validateChatInput(rawInput);
    
    if (!validation.valid) {
      logSecurityEvent({
        type: 'invalid_input',
        details: validation.error || 'Input validation failed',
        severity: 'medium'
      });
      
      return new Response(JSON.stringify({
        error: 'Invalid request format'
      }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, userId, appData } = validation.sanitized;

    // Check rate limiting
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      logSecurityEvent({
        type: 'rate_limit',
        userId,
        details: 'Rate limit exceeded for chat requests',
        severity: 'medium'
      });

      return new Response(JSON.stringify({
        error: 'Rate limit exceeded. Please try again later.',
        resetTime: rateLimitCheck.resetTime
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          ...securityHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000).toString()
        },
      });
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
        logSecurityEvent({
          type: 'suspicious_activity',
          userId,
          details: `Database error during time entry fetch: ${dbError.message}`,
          severity: 'low'
        });
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
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in handleChatRequest:', error);
    
    logSecurityEvent({
      type: 'suspicious_activity',
      details: `Unexpected error in chat handler: ${error.message}`,
      severity: 'high'
    });
    
    return new Response(JSON.stringify({
      error: 'An unexpected error occurred. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
    });
  }
}
