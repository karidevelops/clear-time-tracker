
import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useFooter } from "@/context/FooterContext";
import { useBanner } from "@/context/BannerContext";
import { useLanguage } from "@/context/LanguageContext";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const ChatWindow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "system", 
      content: "You are a helpful assistant. If a user wants to change the footer color, include 'changeFooterColor(color)' in your response where color is a valid Tailwind color class. If a user wants to change the banner text, include 'changeBannerText(text)' in your response."
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"unknown" | "success" | "error">("unknown");
  const { toast } = useToast();
  const { setFooterColor } = useFooter();
  const { setBannerText } = useBanner();

  useEffect(() => {
    if (isOpen && apiStatus === "unknown") {
      testOpenAIAPI();
    }
  }, [isOpen]);

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

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    const userMessage = { role: "user" as const, content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
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
      
      const assistantResponse = data.response;
      console.log("Raw AI response:", assistantResponse);
      
      const cleanedContent = handleAIUIChanges(assistantResponse);
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanedContent },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error.message || "Failed to get response. Please try again.";
      setError(errorMessage);
      toast({
        title: t("chat_error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIUIChanges = (message: string) => {
    console.log("Processing message for UI changes:", message);
    
    // Improved regex for footer color - matches both with and without quotes
    const colorRegex = /changeFooterColor\(['"]?(bg-[a-z]+-[0-9]+)['"]?\)/i;
    const colorMatch = message.match(colorRegex);
    
    if (colorMatch && colorMatch[1]) {
      const color = colorMatch[1].trim();
      console.log(`Detected footer color change request: ${color}`);
      setFooterColor(color);
      toast({
        title: t("footer_changed"),
        description: color,
      });
    } else {
      console.log("No footer color change detected");
    }
    
    // Improved regex for banner text - better handles quoted text
    const textRegex = /changeBannerText\(["'](.+?)["']\)/;
    const textMatch = message.match(textRegex);
    
    if (textMatch && textMatch[1]) {
      const text = textMatch[1].trim();
      console.log(`Detected banner text change request: ${text}`);
      setBannerText(text);
      toast({
        title: t("banner_changed"),
        description: text,
      });
    } else {
      console.log("No banner text change detected");
    }
    
    // Remove the function calls from the displayed message
    return message
      .replace(/changeFooterColor\([^)]+\)/g, '')
      .replace(/changeBannerText\([^)]+\)/g, '')
      .trim();
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
            placeholder={t("chat_placeholder")}
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
