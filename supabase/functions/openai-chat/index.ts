
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    // Use the provided API key for testing (you should move this to environment variables in production)
    const apiKey = "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";
    
    console.log('Making request to OpenAI API...');
    
    // Make the chat completion request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      }),
    });
    
    console.log('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error response:', errorData);
      
      throw new Error(`OpenAI API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    console.log('Received response from OpenAI API');
    
    return new Response(JSON.stringify({ 
      response: data.choices[0].message.content
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in openai-chat function:', error.message);
    
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
