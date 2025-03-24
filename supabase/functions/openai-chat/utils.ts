
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detect UI customization requests in multiple languages
export function isColorChangeRequest(message: string): boolean {
  const lowercaseMessage = message.toLowerCase();
  return (
    (lowercaseMessage.includes('change') && lowercaseMessage.includes('color')) || 
    (lowercaseMessage.includes('muuta') && lowercaseMessage.includes('väri')) || 
    (lowercaseMessage.includes('vaihda') && lowercaseMessage.includes('väri')) || 
    (lowercaseMessage.includes('ändra') && lowercaseMessage.includes('färg'))
  );
}

// Detect hour-related queries in multiple languages
export function isHoursQuery(message: string): boolean {
  const lowercaseMessage = message.toLowerCase();
  return (
    // English patterns
    lowercaseMessage.includes('hour') || 
    lowercaseMessage.includes('time') ||
    lowercaseMessage.includes('show my hours') ||
    lowercaseMessage.includes('tell me hours') ||
    
    // Finnish patterns
    lowercaseMessage.includes('tunti') || 
    lowercaseMessage.includes('aika') || 
    lowercaseMessage.includes('näytä tunnit') ||
    lowercaseMessage.includes('kerro tunnit') ||
    lowercaseMessage.includes('paljonko tunteja') ||
    lowercaseMessage.includes('montako tuntia') ||
    (lowercaseMessage.includes('selvitä') && lowercaseMessage.includes('tunnit')) ||
    (lowercaseMessage.includes('paljonko') && lowercaseMessage.includes('tunti')) ||
    (lowercaseMessage.includes('montako') && lowercaseMessage.includes('tunti')) ||
    
    // Swedish patterns
    lowercaseMessage.includes('visa mina timmar') ||
    lowercaseMessage.includes('hur många timmar') ||
    
    // Additional simple patterns that may be missed
    lowercaseMessage.includes('työaika') ||
    lowercaseMessage.includes('work time') ||
    lowercaseMessage.includes('työtunnit') ||
    lowercaseMessage.includes('työaikani') ||
    lowercaseMessage.includes('työaikaa') ||
    lowercaseMessage.includes('how many hours') ||
    lowercaseMessage.includes('check hours') ||
    lowercaseMessage.includes('view hours')
  );
}

// Detect application info queries (clients, projects)
export function isAppInfoQuery(message: string): boolean {
  const lowercaseMessage = message.toLowerCase();
  return (
    lowercaseMessage.includes('client') || 
    lowercaseMessage.includes('project') || 
    lowercaseMessage.includes('asiakas') || 
    lowercaseMessage.includes('projekti') ||
    lowercaseMessage.includes('list') ||
    lowercaseMessage.includes('show me') ||
    lowercaseMessage.includes('näytä')
  );
}

export function getEnvOrThrow(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
}
