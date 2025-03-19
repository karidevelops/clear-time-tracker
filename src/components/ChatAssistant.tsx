
import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ChatAssistant = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chat_welcome_message') || 'Hei! Olen avustajasi. Miten voin auttaa sinua tuntikirjauksissa tänään?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    // Add user message to the chat
    const userMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    
    try {
      // Process the user message
      const response = await processUserMessage(userMessage.text);
      
      // Add assistant response to the chat
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant' as const,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: t('chat_error_message') || 'Valitettavasti tapahtui virhe. Yritä uudelleen myöhemmin.',
        sender: 'assistant' as const,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const processUserMessage = async (message: string): Promise<string> => {
    // Simple keyword-based intent recognition for demonstration
    const lowerMessage = message.toLowerCase();
    
    // Copy previous day's entries
    if (
      (lowerMessage.includes('sama') || lowerMessage.includes('kopioi') || lowerMessage.includes('copy')) &&
      (lowerMessage.includes('eilen') || lowerMessage.includes('edellinen') || lowerMessage.includes('previous') || lowerMessage.includes('yesterday'))
    ) {
      return await copyPreviousDayEntries();
    } 
    
    // Display today's entries
    else if (
      (lowerMessage.includes('näytä') || lowerMessage.includes('mitä') || lowerMessage.includes('show') || lowerMessage.includes('what')) &&
      (lowerMessage.includes('tänään') || lowerMessage.includes('today'))
    ) {
      return await getTodayEntries();
    }
    
    // Display yesterday's entries
    else if (
      (lowerMessage.includes('näytä') || lowerMessage.includes('mitä') || lowerMessage.includes('show') || lowerMessage.includes('what')) &&
      (lowerMessage.includes('eilen') || lowerMessage.includes('yesterday'))
    ) {
      return await getYesterdayEntries();
    }
    
    // Basic help
    else if (lowerMessage.includes('auta') || lowerMessage.includes('help') || lowerMessage.includes('apua')) {
      return t('chat_help_message') || 
        'Voin auttaa sinua tuntikirjausten kanssa. Esimerkiksi:\n' +
        '- "Kopioi eilisen tunnit tälle päivälle"\n' +
        '- "Näytä tämän päivän kirjaukset"\n' +
        '- "Näytä eilisen kirjaukset"';
    }
    
    // Default response
    return t('chat_dont_understand') || 
      'En ymmärtänyt täysin pyyntöäsi. Voisitko tarkentaa? Voit esimerkiksi pyytää kopioimaan eilisen kirjaukset tai näyttämään tämän päivän kirjaukset.';
  };

  const copyPreviousDayEntries = async (): Promise<string> => {
    if (!user) return t('login_required') || 'Kirjaudu sisään käyttääksesi tätä toimintoa.';
    
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    
    try {
      // Fetch yesterday's entries
      const { data: yesterdayEntries, error: fetchError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', yesterdayStr);
      
      if (fetchError) throw fetchError;
      
      if (!yesterdayEntries || yesterdayEntries.length === 0) {
        return t('no_entries_yesterday') || 'Eiliselle päivälle ei löytynyt kirjauksia.';
      }
      
      // Check for existing entries today to avoid duplicates
      const { data: todayEntries, error: todayError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayStr);
      
      if (todayError) throw todayError;
      
      if (todayEntries && todayEntries.length > 0) {
        return t('entries_exist_today') || 'Tälle päivälle on jo kirjauksia. Haluatko silti kopioida eilisen kirjaukset?';
      }
      
      // Create new entries based on yesterday's entries
      const newEntries = yesterdayEntries.map(entry => ({
        date: todayStr,
        hours: entry.hours,
        description: entry.description,
        project_id: entry.project_id,
        user_id: user.id,
        status: 'draft'
      }));
      
      const { error: insertError } = await supabase
        .from('time_entries')
        .insert(newEntries);
      
      if (insertError) throw insertError;
      
      return t('copied_entries_success', { count: newEntries.length }) || 
        `Kopioitu ${newEntries.length} kirjausta eiliseltä tälle päivälle.`;
    } catch (error) {
      console.error('Error copying entries:', error);
      return t('error_copying_entries') || 'Virhe kirjausten kopioinnissa. Yritä uudelleen myöhemmin.';
    }
  };

  const getTodayEntries = async (): Promise<string> => {
    if (!user) return t('login_required') || 'Kirjaudu sisään käyttääksesi tätä toimintoa.';
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      const { data: entries, error } = await supabase
        .from('time_entries')
        .select('*, projects(name)')
        .eq('user_id', user.id)
        .eq('date', today);
      
      if (error) throw error;
      
      if (!entries || entries.length === 0) {
        return t('no_entries_today') || 'Tälle päivälle ei ole vielä kirjauksia.';
      }
      
      const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
      
      let response = t('today_entries_summary', { count: entries.length, hours: totalHours }) || 
        `Tänään on ${entries.length} kirjausta, yhteensä ${totalHours} tuntia:\n\n`;
      
      entries.forEach((entry, index) => {
        response += `${index + 1}. ${(entry.projects as any)?.name || 'Tuntematon projekti'}: ${entry.hours}h - ${entry.description || 'Ei kuvausta'}\n`;
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching today entries:', error);
      return t('error_fetching_entries') || 'Virhe kirjausten hakemisessa. Yritä uudelleen myöhemmin.';
    }
  };

  const getYesterdayEntries = async (): Promise<string> => {
    if (!user) return t('login_required') || 'Kirjaudu sisään käyttääksesi tätä toimintoa.';
    
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    try {
      const { data: entries, error } = await supabase
        .from('time_entries')
        .select('*, projects(name)')
        .eq('user_id', user.id)
        .eq('date', yesterday);
      
      if (error) throw error;
      
      if (!entries || entries.length === 0) {
        return t('no_entries_yesterday') || 'Eiliselle päivälle ei löytynyt kirjauksia.';
      }
      
      const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
      
      let response = t('yesterday_entries_summary', { count: entries.length, hours: totalHours }) || 
        `Eilen oli ${entries.length} kirjausta, yhteensä ${totalHours} tuntia:\n\n`;
      
      entries.forEach((entry, index) => {
        response += `${index + 1}. ${(entry.projects as any)?.name || 'Tuntematon projekti'}: ${entry.hours}h - ${entry.description || 'Ei kuvausta'}\n`;
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching yesterday entries:', error);
      return t('error_fetching_entries') || 'Virhe kirjausten hakemisessa. Yritä uudelleen myöhemmin.';
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white">
      <div className="p-4 font-medium border-b bg-reportronic-50 text-reportronic-700">
        {t('ai_assistant') || 'AI-Avustaja'}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[75%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-reportronic-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-line">{message.text}</div>
              <div
                className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-reportronic-100' : 'text-gray-500'
                }`}
              >
                {format(message.timestamp, 'HH:mm')}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={t('chat_placeholder') || 'Kirjoita viesti...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isProcessing || !inputValue.trim()}
            className="bg-reportronic-500 hover:bg-reportronic-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
