
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const MessageInput = ({ onSendMessage, isLoading, placeholder = "Type a message..." }: MessageInputProps) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Example suggestions for quick access - removed banner text suggestions
  const suggestions = [
    { text: "Change footer color to blue", lang: "en" },
    { text: "Vaihda alapalkin väri punaiseksi", lang: "fi" },
  ];

  return (
    <div className="p-3 border-t">
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
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
        
        <div className="flex flex-wrap gap-1">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs py-1"
              onClick={() => setMessage(suggestion.text)}
              title={suggestion.text}
            >
              {suggestion.text.length > 25 
                ? suggestion.text.substring(0, 22) + "..." 
                : suggestion.text}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
