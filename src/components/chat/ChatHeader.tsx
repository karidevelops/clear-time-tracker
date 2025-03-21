
import { Button } from "@/components/ui/button";
import { X, Clock } from "lucide-react";

interface ChatHeaderProps {
  onClose: () => void;
  onTestAPI: () => void;
  isLoading: boolean;
}

const ChatHeader = ({ onClose, onTestAPI, isLoading }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-reportronic-500 text-white">
      <h3 className="font-medium flex items-center">
        <Clock className="mr-1.5 h-4 w-4" />
        Reportronic Assistant
      </h3>
      <div className="flex items-center space-x-2">
        <Button
          onClick={onTestAPI}
          size="sm"
          variant="ghost"
          className="px-2 text-white hover:bg-reportronic-600"
          disabled={isLoading}
        >
          Test API
        </Button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-reportronic-600 rounded"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
