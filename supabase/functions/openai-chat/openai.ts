
import { Message } from "./messages.ts";
import { getEnvOrThrow } from "./utils.ts";

export async function callOpenAI(messages: Message[]): Promise<string> {
  // Get the API key from environment
  const apiKey = getEnvOrThrow('OPENAI_API_KEY');
  console.log('Using API key starting with:', apiKey.substring(0, 5) + '...');
  console.log('Request messages length:', messages.length);
  
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
  
  const aiResponse = data.choices[0].message.content;
  console.log('AI response preview:', aiResponse.substring(0, 100));
  
  return aiResponse;
}
