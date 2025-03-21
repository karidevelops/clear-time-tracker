
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
    console.log('Request messages:', JSON.stringify(messages));
    
    // Use a valid OpenAI API key
    const apiKey = "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";
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',  // Using a more reliable model
          messages,
          temperature: 0.7,
        }),
      });

      console.log('OpenAI API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error response:', errorData);
        
        try {
          const parsedError = JSON.parse(errorData);
          throw new Error(`OpenAI API error: ${parsedError.error?.message || response.statusText}`);
        } catch {
          throw new Error(`OpenAI API error: ${response.statusText} (${response.status})`);
        }
      }

      const data = await response.json();
      console.log('Received response from OpenAI API');
      
      return new Response(JSON.stringify({ 
        response: data.choices[0].message.content 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (apiError) {
      console.error('Error calling OpenAI API:', apiError);
      throw new Error(`Failed to call OpenAI API: ${apiError.message}`);
    }
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
