
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

    console.log('Sending request to OpenAI API with', messages.length, 'messages');
    
    // Get the OpenAI API key
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Fallback to a manually supplied API key if the environment variable isn't set
    // This is a temporary solution until the secrets are properly configured
    const manualApiKey = "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";
    
    // Use either the environment variable or the fallback key
    const finalApiKey = apiKey || manualApiKey;
    
    if (!finalApiKey) {
      throw new Error('OpenAI API key is not available');
    }
    
    console.log('API Key available:', finalApiKey ? 'Yes' : 'No');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${finalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Received response from OpenAI API');
    
    return new Response(JSON.stringify({ 
      response: data.choices[0].message.content 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in openai-chat function:', error);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Unknown error occurred';
    const errorResponse = {
      error: errorMessage,
      details: error.stack || 'No stack trace available'
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
