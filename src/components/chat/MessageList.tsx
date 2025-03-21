
import { useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, MessageSquareText } from "lucide-react";

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

  // Show help if there are only system messages (empty chat)
  const showHelp = messages.length === 1 && messages[0].role === "system";

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
      
      {showHelp && (
        <Alert className="mb-3 bg-blue-50 border-blue-200">
          <MessageSquareText className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800">
            <p className="font-medium mb-1">Voit kirjata tunteja kirjoittamalla:</p>
            <p className="text-xs text-blue-700 font-mono">log 7.5h Projektin Nimi: Työn kuvaus</p>
            <p className="mt-1 text-xs">Esimerkki: log 4h Website Development: Lomakkeiden toteutus</p>
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
  );
};

export default MessageList;
