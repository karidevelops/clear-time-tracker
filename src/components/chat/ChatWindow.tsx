
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useFooter } from "@/context/FooterContext";
import { useBanner } from "@/context/BannerContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useChatAPI } from "./hooks/useChatAPI";
import { useChatUI } from "./utils/chatUIUtils";
import { useChatState } from "./hooks/useChatState";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ChatWindow = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { setFooterColor } = useFooter();
  const { setBannerText } = useBanner();
  const [appData, setAppData] = useState({ clients: [], projects: [] });

  // Fetch real clients from Supabase
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['chat-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name');
      
      if (error) {
        console.error('Error fetching clients for chat:', error);
        return [];
      }
      return data;
    }
  });

  // Fetch real projects from Supabase
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['chat-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client_id');
      
      if (error) {
        console.error('Error fetching projects for chat:', error);
        return [];
      }
      return data;
    }
  });

  // Update appData when clients and projects are loaded
  useEffect(() => {
    if (!isLoadingClients && !isLoadingProjects) {
      setAppData({
        clients,
        projects
      });
    }
  }, [clients, projects, isLoadingClients, isLoadingProjects]);

  const {
    isOpen,
    setIsOpen,
    messages,
    timeEntrySummary: stateSummary,
    handleSendMessage
  } = useChatState({
    initialSystemMessage: "You are a helpful assistant for Reportronic time tracking application. You can help users understand how to use the app, find information about their time entries, projects, and clients. If a user wants to change the footer color, include 'changeFooterColor(color)' in your response where color is a valid Tailwind color class."
  });

  const { handleAIUIChanges } = useChatUI({ 
    setFooterColor, 
    setBannerText, 
    toast, 
    t 
  });

  const {
    isLoading,
    error,
    apiStatus,
    timeEntrySummary: apiSummary,
    testOpenAIAPI,
    sendMessage,
    clearError
  } = useChatAPI({
    userId: user?.id,
    onUIChange: handleAIUIChanges,
    appData // Pass real application data to the chat API
  });

  useEffect(() => {
    if (isOpen && apiStatus === "unknown") {
      testOpenAIAPI();
    }
  }, [isOpen, apiStatus]);

  const onSendMessage = async (message: string) => {
    await handleSendMessage(sendMessage, message);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex flex-col w-80 sm:w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <ChatHeader 
            onClose={() => setIsOpen(false)} 
            isLoading={isLoading} 
          />
          
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            error={error} 
            apiStatus={apiStatus} 
            clearError={clearError}
            timeEntrySummary={apiSummary || stateSummary}
          />
          
          <MessageInput 
            onSendMessage={onSendMessage} 
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
