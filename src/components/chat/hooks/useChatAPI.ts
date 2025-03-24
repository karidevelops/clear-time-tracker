
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface TimeEntrySummary {
  totalHours: number;
  projectHours: Record<string, number>;
  clientHours: Record<string, number>;
  dailyHours: Record<string, number>;
  weekRange: string;
}

interface AppData {
  clients: any[];
  projects: any[];
}

interface UseChatAPIProps {
  userId?: string;
  onUIChange?: (message: string) => string;
  appData?: AppData;
}

export const useChatAPI = ({ userId, onUIChange, appData }: UseChatAPIProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"unknown" | "success" | "error">("unknown");
  const [timeEntrySummary, setTimeEntrySummary] = useState<TimeEntrySummary | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const testOpenAIAPI = async () => {
    setIsLoading(true);
    setError(null);
    setApiStatus("unknown");
    
    try {
      console.log("Testing OpenAI API connection...");
      
      const { data, error: supabaseError } = await supabase.functions.invoke("openai-chat", {
        body: { messages: [{ role: "user", content: "Hello" }], userId },
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
        title: t("api_test_successful"),
        description: t("openai_api_working"),
      });
    } catch (error) {
      console.error("Error testing API:", error);
      const errorMessage = error.message || "Failed to test API. Please check your API key.";
      setError(errorMessage);
      setApiStatus("error");
      toast({
        title: t("api_test_failed"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messages: Message[], newMessage: string): Promise<{
    updatedMessages: Message[];
    timeEntrySummary?: TimeEntrySummary | null;
  }> => {
    if (!newMessage.trim()) return { updatedMessages: messages };
    
    const userMessage: Message = { role: "user", content: newMessage };
    const updatedMessages = [...messages, userMessage];
    setIsLoading(true);
    setError(null);
    setTimeEntrySummary(null);
    
    try {
      console.log("Sending request to Edge Function...");
      console.log("Current user ID:", userId);
      
      const { data, error: supabaseError } = await supabase.functions.invoke("openai-chat", {
        body: { 
          messages: updatedMessages,
          userId, // Pass user ID to edge function
          appData  // Pass application data to edge function
        },
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
      
      const assistantResponse = data.response;
      console.log("Raw AI response:", assistantResponse);
      
      // Store time entry summary if available
      if (data.hasTimeEntryData && data.summary) {
        console.log("Time entry summary received:", data.summary);
        setTimeEntrySummary(data.summary);
      }
      
      let cleanedContent = assistantResponse;
      
      if (onUIChange) {
        cleanedContent = onUIChange(assistantResponse);
      }
      
      const finalMessages: Message[] = [
        ...updatedMessages,
        { role: "assistant", content: cleanedContent },
      ];
      
      return {
        updatedMessages: finalMessages,
        timeEntrySummary: data.hasTimeEntryData ? data.summary as TimeEntrySummary : null
      };
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error.message || "Failed to get response. Please try again.";
      setError(errorMessage);
      toast({
        title: t("chat_error"),
        description: errorMessage,
        variant: "destructive",
      });
      return { updatedMessages };
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    isLoading,
    error,
    apiStatus,
    timeEntrySummary,
    testOpenAIAPI,
    sendMessage,
    clearError
  };
};
