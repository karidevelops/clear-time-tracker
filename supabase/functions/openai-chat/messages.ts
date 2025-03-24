
import { TimeEntry, WeeklySummary } from "./database.ts";
import { isColorChangeRequest, isHoursQuery } from "./utils.ts";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AppData {
  clients: any[];
  projects: any[];
}

export function prepareSystemMessages(
  messages: Message[],
  lastUserMessage: string,
  timeEntriesData: TimeEntry[] | null,
  weeklyHoursSummary: WeeklySummary | null,
  appData: AppData | undefined
): Message[] {
  const messagesWithSystem = [...messages];
  
  if (isColorChangeRequest(lastUserMessage) && 
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
  
  if (isHoursQuery(lastUserMessage)) {
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
).join('\n')}

When presenting this information to the user, format it clearly and concisely. Respond in the same language as the user's query.`;
    } else {
      // If no data available, use the default response
      hoursSystemContent += `
When users ask about their hours:
1. Explain that you don't have direct access to their specific time entries at the moment
2. Suggest that they might need to log in or check if they have any time entries for the current week
3. Offer to help them navigate to the Weekly View or Monthly View where they can see their time entries in detail
4. If they need specific data analysis, suggest using the built-in reports`;
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

  // Add application data information
  if (appData && 
      !messages.some(m => m.role === 'system' && m.content.includes('APP_DATA'))) {
    
    let appDataContent = `APP_DATA: You are an AI assistant for Reportronic time tracking application.`;
    
    if (appData.clients && appData.clients.length > 0) {
      appDataContent += `
Here is information about the clients and projects in the system:

Clients:
${appData.clients.map(client => 
  `- ${client.name} (ID: ${client.id})`
).join('\n')}

Projects:`;

      if (appData.projects && appData.projects.length > 0) {
        appDataContent += `
${appData.projects.map(project => {
  // Find client name for this project
  const clientName = appData.clients.find(c => c.id === project.client_id)?.name || "Unknown";
  return `- ${project.name} (ID: ${project.id}, Client: ${clientName})`;
}).join('\n')}`;
      } else {
        appDataContent += `\nNo projects found in the system.`;
      }

      // Add specific sections for each client and their projects
      appDataContent += `\n\nProjects by Client:`;
      for (const client of appData.clients) {
        const clientProjects = appData.projects?.filter(p => p.client_id === client.id) || [];
        appDataContent += `\n\n${client.name} projects:`;
        
        if (clientProjects.length > 0) {
          appDataContent += `\n${clientProjects.map(p => `- ${p.name}`).join('\n')}`;
        } else {
          appDataContent += `\nNo projects found for this client.`;
        }
      }

      appDataContent += `\n\nUse this information to help users understand what clients and projects are available in the system.
Make sure to answer questions about specific clients and their projects accurately.
Respond in the same language as the user's query.`;
    } else {
      appDataContent += `
When users ask about clients and projects:
1. Explain that the Reportronic system contains various clients and projects
2. Direct them to check the Clients & Projects page for a complete list
3. Suggest using the dropdown menus when creating time entries to see available options`;
    }
    
    messagesWithSystem.unshift({
      role: 'system',
      content: appDataContent
    });
  }

  return messagesWithSystem;
}
