
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
    
    // Get the API key from environment variable
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      throw new Error('OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.');
    }
    
    // Test API key validity with a simple echo request
    console.log('Testing OpenAI API connectivity...');
    
    try {
      console.log('Making request to OpenAI API...');
      
      // First, let's log a masked version of the API key for debugging
      console.log('API Key format (masked):', `${apiKey.slice(0, 3)}...${apiKey.slice(-4)}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say "API test successful"' }],
          temperature: 0.7,
          max_tokens: 20,
        }),
      });
      
      console.log('OpenAI API test response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API test error response:', errorData);
        
        try {
          const parsedError = JSON.parse(errorData);
          throw new Error(`OpenAI API error: ${parsedError.error?.message || response.statusText}`);
        } catch {
          throw new Error(`OpenAI API error: ${response.statusText} (${response.status})`);
        }
      }

      const testData = await response.json();
      console.log('OpenAI API connectivity test successful!');
      
      // Now, make the actual request with user messages
      const actualResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
      
      console.log('OpenAI API actual response status:', actualResponse.status);
      
      if (!actualResponse.ok) {
        const errorData = await actualResponse.text();
        console.error('OpenAI API error response:', errorData);
        
        try {
          const parsedError = JSON.parse(errorData);
          throw new Error(`OpenAI API error: ${parsedError.error?.message || actualResponse.statusText}`);
        } catch {
          throw new Error(`OpenAI API error: ${actualResponse.statusText} (${actualResponse.status})`);
        }
      }

      const data = await actualResponse.json();
      console.log('Received response from OpenAI API');
      
      return new Response(JSON.stringify({ 
        response: data.choices[0].message.content,
        test_result: testData.choices[0].message.content
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (apiError) {
      console.error('Error calling OpenAI API:', apiError);
      throw new Error(`Failed to call OpenAI API: ${apiError.message}`);
    }
  } catch (error) {
    console.error('Error in openai-chat function:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
