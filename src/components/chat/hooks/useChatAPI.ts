
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { InputValidator } from "@/utils/security/inputValidation";
import { chatRateLimiter } from "@/utils/security/rateLimiter";
import { SecureErrorHandler, SecurityLogger } from "@/utils/security/errorHandler";

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
      console.log("Testing OpenAI API connection with user ID:", userId);
      
      if (!userId) {
        throw new Error('User ID is required for chat functionality');
      }

      // Check rate limit
      const rateLimitCheck = chatRateLimiter.checkLimit(userId);
      if (!rateLimitCheck.allowed) {
        const waitTime = Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000);
        throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
      }
      
      const testMessage = { role: "user" as const, content: "Hello" };
      const validation = InputValidator.validateChatMessage(testMessage.content);
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid message format');
      }

      const { data, error: supabaseError } = await supabase.functions.invoke("openai-chat", {
        body: { 
          messages: [{ ...testMessage, content: validation.sanitized }], 
          userId,
          appData
        },
      });
      
      console.log("Test response from Edge Function:", data);
      
      if (supabaseError) {
        console.error("Supabase function error:", supabaseError);
        SecurityLogger.logEvent({
          type: 'auth_failure',
          userId,
          details: `Supabase function error: ${supabaseError.message}`
        });
        throw new Error(SecureErrorHandler.handleError(supabaseError, 'chat'));
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
    } catch (error: any) {
      console.error("Error testing API:", error);
      const errorMessage = SecureErrorHandler.handleError(error, 'chat');
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
    
    if (!userId) {
      throw new Error('User must be logged in to use chat');
    }

    // Validate input
    const validation = InputValidator.validateChatMessage(newMessage);
    if (!validation.isValid) {
      SecurityLogger.logEvent({
        type: 'invalid_input',
        userId,
        details: validation.error || 'Invalid chat message'
      });
      throw new Error(validation.error || 'Invalid message format');
    }

    // Check rate limit
    const rateLimitCheck = chatRateLimiter.checkLimit(userId);
    if (!rateLimitCheck.allowed) {
      SecurityLogger.logEvent({
        type: 'rate_limit',
        userId,
        details: 'Chat rate limit exceeded'
      });
      const waitTime = Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
    }
    
    const userMessage: Message = { role: "user", content: validation.sanitized || newMessage };
    const updatedMessages = [...messages, userMessage];
    setIsLoading(true);
    setError(null);
    setTimeEntrySummary(null);
    
    try {
      console.log("Sending request to Edge Function with user ID:", userId);
      console.log("Message:", newMessage);
      console.log("Passing appData with clients:", appData?.clients?.length || 0, "projects:", appData?.projects?.length || 0);
      
      const { data, error: supabaseError } = await supabase.functions.invoke("openai-chat", {
        body: { 
          messages: updatedMessages,
          userId,
          appData
        },
      });
      
      console.log("Response from Edge Function:", data);
      
      if (supabaseError) {
        console.error("Supabase function error:", supabaseError);
        SecurityLogger.logEvent({
          type: 'auth_failure',
          userId,
          details: `Supabase function error: ${supabaseError.message}`
        });
        throw new Error(SecureErrorHandler.handleError(supabaseError, 'chat'));
      }
      
      if (data?.error) {
        console.error("API response error:", data.error);
        if (data.error.includes('Rate limit')) {
          SecurityLogger.logEvent({
            type: 'rate_limit',
            userId,
            details: 'Server-side rate limit exceeded'
          });
        }
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
      } else {
        console.log("No time entry data received in the response");
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
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage = SecureErrorHandler.handleError(error, 'chat');
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
