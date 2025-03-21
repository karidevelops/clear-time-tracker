import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const ChatWindow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "You are a helpful assistant. You can also log work hours. To log hours, use format: 'log 7.5h Project Name: Description'." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"unknown" | "success" | "error">("unknown");
  const { toast } = useToast();
  const { user } = useAuth();

  const testOpenAIAPI = async () => {
    setIsLoading(true);
    setError(null);
    setApiStatus("unknown");
    
    try {
      console.log("Testing OpenAI API connection...");
      
      const { data, error: supabaseError } = await supabase.functions.invoke("openai-chat", {
        body: { messages: [{ role: "user", content: "Hello" }] },
      });
      
      console.log("Test response from Edge Function:", data);
      
      if (supabaseError) {
        console.error("Supabase function error:", supabaseError);
        throw new Error(supabaseError.message || "Error calling the chat function");
      }
      
      if (data?.error) {
        console.error("API response error:", data.error);
        throw new Error(data.error);
      }
      
      setApiStatus("success");
      toast({
        title: "API Test Successful",
        description: "OpenAI API is working correctly",
      });
    } catch (error) {
      console.error("Error testing API:", error);
      const errorMessage = error.message || "Failed to test API. Please check your API key.";
      setError(errorMessage);
      setApiStatus("error");
      toast({
        title: "API Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogHours = async (message: string) => {
    if (!user) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Kirjautuminen vaaditaan tuntien kirjaamiseen. Ole hyvä ja kirjaudu sisään ensin." },
      ]);
      return false;
    }

    try {
      const match = message.match(/^log\s+(\d+\.?\d*)h\s+([^:]+):\s*(.+)$/i);
      
      if (!match) {
        return false;
      }
      
      const [_, hoursStr, projectName, description] = match;
      const hours = parseFloat(hoursStr);
      
      if (isNaN(hours) || hours <= 0) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Tuntimäärän täytyy olla positiivinen numero." },
        ]);
        return true;
      }
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .ilike('name', `%${projectName.trim()}%`)
        .limit(1);
        
      if (projectError || !projectData || projectData.length === 0) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Projektia nimeltä "${projectName.trim()}" ei löytynyt. Tarkista projektin nimi.` },
        ]);
        return true;
      }
      
      const projectId = projectData[0].id;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error: saveError } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.id,
          project_id: projectId,
          hours: hours,
          description: description.trim(),
          date: today,
          status: 'draft'
        });
        
      if (saveError) {
        console.error('Error saving time entry:', saveError);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Virhe tuntien tallennuksessa: ${saveError.message}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `${hours}h kirjattu projektille "${projectName.trim()}". Kuvaus: ${description.trim()}` },
        ]);
        toast({
          title: "Tunnit kirjattu",
          description: `${hours}h kirjattu projektille "${projectName.trim()}"`,
        });
      }
      return true;
    } catch (err) {
      console.error("Error in handleLogHours:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Virhe tuntien kirjauksessa. Yritä uudelleen." },
      ]);
      return true;
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    const userMessage = { role: "user" as const, content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    const isLoggingCommand = message.trim().toLowerCase().startsWith('log ');
    
    if (isLoggingCommand) {
      const handled = await handleLogHours(message);
      if (handled) {
        setIsLoading(false);
        return;
      }
    }
    
    try {
      console.log("Sending request to Edge Function...");
      
      const { data, error: supabaseError } = await supabase.functions.invoke("openai-chat", {
        body: { messages: [...messages, userMessage] },
      });
      
      console.log("Response from Edge Function:", data);
      
      if (supabaseError) {
        console.error("Supabase function error:", supabaseError);
        throw new Error(supabaseError.message || "Error calling the chat function");
      }
      
      if (data?.error) {
        console.error("API response error:", data.error);
        throw new Error(data.error);
      }
      
      if (!data || !data.response) {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format from server");
      }
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error.message || "Failed to get response. Please try again.";
      setError(errorMessage);
      toast({
        title: "Chat Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex flex-col w-80 sm:w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <ChatHeader 
            onClose={() => setIsOpen(false)} 
            onTestAPI={testOpenAIAPI} 
            isLoading={isLoading} 
          />
          
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            error={error} 
            apiStatus={apiStatus} 
            clearError={clearError} 
          />
          
          <MessageInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
          />
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 flex items-center justify-center shadow-lg bg-reportronic-500 hover:bg-reportronic-600"
        >
          <MessageCircle size={24} />
        </Button>
      )}
    </div>
  );
};

export default ChatWindow;
