
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

    // Get the API key from environment or use the provided one
    // The key format looks incorrect - it should start with 'sk-' not 'sk-proj-'
    // Switching to standard OpenAI API key format
    const apiKey = Deno.env.get('OPENAI_API_KEY') || "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";
    
    console.log('Making request to OpenAI API...');
    console.log('Using API key starting with:', apiKey.substring(0, 5) + '...');
    console.log('Request messages length:', messages.length);
    console.log('First few characters of first message:', 
      messages[0]?.content ? messages[0].content.substring(0, 20) + '...' : 'No content');
    
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
    
    return new Response(JSON.stringify({ 
      response: data.choices[0].message.content
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
