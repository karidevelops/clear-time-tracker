
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const ChatWindow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = { role: "user" as const, content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase.functions.invoke("openai-chat", {
        body: { messages: [...messages, userMessage] },
      });
      
      console.log("Response from Edge Function:", data);
      
      if (supabaseError) {
        console.error("Supabase function error:", supabaseError);
        throw new Error(supabaseError.message || "Error calling the chat function");
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      if (!data || !data.response) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearError = () => setError(null);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex flex-col w-80 sm:w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-reportronic-500 text-white">
            <h3 className="font-medium">Chat Assistant</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-reportronic-600 rounded"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
            {error && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {error}
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={clearError} 
                    className="ml-2 p-0 h-auto text-xs text-white"
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {messages.slice(1).map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-reportronic-100 text-reportronic-900"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-white border border-gray-200">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="resize-none min-h-[60px] max-h-[120px]"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !message.trim()}
                size="icon"
                className="self-end"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
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
