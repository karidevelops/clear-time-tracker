
import { useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Clock, PieChart, LineChart, BarChart3 } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface TimeEntrySummary {
  totalHours: number;
  projectHours: Record<string, number>;
  clientHours: Record<string, number>;
  dailyHours: Record<string, number>;
  weekRange: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  apiStatus: "unknown" | "success" | "error";
  clearError: () => void;
  timeEntrySummary?: TimeEntrySummary | null;
}

const MessageList = ({
  messages,
  isLoading,
  error,
  apiStatus,
  clearError,
  timeEntrySummary,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, timeEntrySummary]);

  // Check if a message is related to hours/time queries
  const isHoursRelatedMessage = (content: string) => {
    const lowerContent = content.toLowerCase();
    return (
      lowerContent.includes("hour") || 
      lowerContent.includes("time") || 
      lowerContent.includes("tunti") || 
      lowerContent.includes("aika") ||
      lowerContent.includes("weekly view") ||
      lowerContent.includes("monthly view") ||
      lowerContent.includes("dashboard") ||
      lowerContent.includes("viikkonäkymä") ||
      lowerContent.includes("kuukausinäkymä")
    );
  };

  // Format hours nicely
  const formatHours = (hours: number) => {
    return hours.toFixed(1);
  };

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
      
      {/* Display messages in chronological order (oldest first) */}
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
                : isHoursRelatedMessage(msg.content)
                  ? "bg-blue-50 border border-blue-200" 
                  : "bg-white border border-gray-200"
            }`}
          >
            {msg.role === "assistant" && isHoursRelatedMessage(msg.content) && (
              <div className="flex items-center mb-1 text-blue-500">
                <Clock size={14} className="mr-1" />
                <span className="text-xs font-medium">Hours Information</span>
              </div>
            )}
            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
          </div>
        </div>
      ))}
      
      {/* Show time entry summary if available */}
      {timeEntrySummary && (
        <div className="flex justify-start">
          <div className="max-w-[100%] w-full p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center mb-2 text-blue-600">
              <PieChart size={16} className="mr-1" />
              <span className="text-sm font-medium">Weekly Hours Summary</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-white p-2 rounded border border-blue-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-600">Total Hours:</span>
                  <span className="text-sm font-bold">{formatHours(timeEntrySummary.totalHours)}h</span>
                </div>
                <div className="text-xs text-gray-500">
                  Week: {timeEntrySummary.weekRange}
                </div>
              </div>
              
              {/* Hours by Project */}
              <div className="bg-white p-2 rounded border border-blue-100">
                <div className="flex items-center mb-1">
                  <BarChart3 size={12} className="mr-1 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600">Hours by Project:</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(timeEntrySummary.projectHours).map(([project, hours], i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate">{project}:</span>
                      <span className="font-medium">{formatHours(hours)}h</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Hours by Client */}
              <div className="bg-white p-2 rounded border border-blue-100">
                <div className="flex items-center mb-1">
                  <LineChart size={12} className="mr-1 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600">Hours by Client:</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(timeEntrySummary.clientHours).map(([client, hours], i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate">{client}:</span>
                      <span className="font-medium">{formatHours(hours)}h</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Daily Breakdown */}
              <div className="bg-white p-2 rounded border border-blue-100">
                <div className="flex items-center mb-1">
                  <Clock size={12} className="mr-1 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600">Daily Breakdown:</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(timeEntrySummary.dailyHours).map(([date, hours], i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{date}:</span>
                      <span className="font-medium">{formatHours(hours)}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
