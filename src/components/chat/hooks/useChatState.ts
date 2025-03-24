
import { useState, useEffect } from "react";
import { Message, TimeEntrySummary } from "./useChatAPI";

interface UseChatStateProps {
  initialSystemMessage: string;
  onOpenChange?: (isOpen: boolean) => void;
}

export const useChatState = ({ initialSystemMessage, onOpenChange }: UseChatStateProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: initialSystemMessage },
  ]);
  const [timeEntrySummary, setTimeEntrySummary] = useState<TimeEntrySummary | null>(null);

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  const handleSendMessage = async (
    sendMessageFn: (messages: Message[], message: string) => Promise<{
      updatedMessages: Message[];
      timeEntrySummary?: TimeEntrySummary | null;
    }>,
    message: string
  ) => {
    if (!message.trim()) return;
    
    const { updatedMessages, timeEntrySummary: newSummary } = await sendMessageFn(messages, message);
    
    setMessages(updatedMessages);
    
    if (newSummary) {
      setTimeEntrySummary(newSummary);
    }
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    setMessages,
    timeEntrySummary,
    handleSendMessage
  };
};
