
import { useToast } from "@/hooks/use-toast";
import { useFooter } from "@/context/FooterContext";
import { useBanner } from "@/context/BannerContext";

interface UseChatUIProps {
  setFooterColor: (color: string) => void;
  setBannerText: (text: string) => void;
  toast: ReturnType<typeof useToast>["toast"];
  t: (key: string) => string;
}

export const useChatUI = ({ setFooterColor, setBannerText, toast, t }: UseChatUIProps) => {
  const handleAIUIChanges = (message: string) => {
    console.log("Processing message for UI changes:", message);
    
    const colorRegex = /changeFooterColor\(['"]?(bg-[a-z]+-[0-9]+)['"]?\)/i;
    const colorMatch = message.match(colorRegex);
    
    if (colorMatch && colorMatch[1]) {
      const color = colorMatch[1].trim();
      console.log(`Detected footer color change request: ${color}`);
      setFooterColor(color);
      toast({
        title: t("footer_changed"),
        description: color,
      });
    } else {
      console.log("No footer color change detected");
    }
    
    return message
      .replace(/changeFooterColor\([^)]+\)/g, '')
      .trim();
  };

  return {
    handleAIUIChanges
  };
};
