
import { useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  apiStatus: "unknown" | "success" | "error";
  clearError: () => void;
}

const MessageList = ({
  messages,
  isLoading,
  error,
  apiStatus,
  clearError,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
      {apiStatus === "success" && (
        <Alert className="mb-3 bg-green-100 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-xs text-green-800">
            API Test: Connection successful!
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {error}
            <button 
              onClick={clearError} 
              className="ml-2 p-0 h-auto text-xs text-white underline"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[80%] p-3 rounded-lg bg-white border border-gray-200">
            <p className="text-sm">Thinking...</p>
          </div>
        </div>
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
      )).reverse()}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
