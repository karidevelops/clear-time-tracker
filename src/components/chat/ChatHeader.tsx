
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ChatHeaderProps {
  onClose: () => void;
  isLoading: boolean;
}

const ChatHeader = ({ onClose, isLoading }: ChatHeaderProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center justify-between p-3 bg-reportronic-500 text-white">
      <h3 className="font-medium">{t("ai_assistant")}</h3>
      <button
        onClick={onClose}
        className="p-1 hover:bg-reportronic-600 rounded"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default ChatHeader;
