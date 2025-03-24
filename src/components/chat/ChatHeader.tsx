
import { Button } from "@/components/ui/button";
import { X, HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onClose: () => void;
  onTestAPI: () => void;
  isLoading: boolean;
}

const ChatHeader = ({ onClose, onTestAPI, isLoading }: ChatHeaderProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center justify-between p-3 bg-reportronic-500 text-white">
      <h3 className="font-medium">{t("ai_assistant")}</h3>
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 text-white hover:bg-reportronic-600"
              >
                <HelpCircle size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="mb-1 font-medium">You can ask the assistant to:</p>
                <ul className="list-disc pl-4">
                  <li>Change the footer color (e.g., "Change footer color to red")</li>
                  <li>Change the banner text (e.g., "Change banner text to My Company")</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
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
