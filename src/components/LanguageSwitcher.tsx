
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FI, SE, GB } from 'country-flag-icons/react/3x2';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setOpen(false);
  };

  const getFlagIcon = () => {
    switch (language) {
      case 'fi':
        return <FI className="h-5 w-5" />;
      case 'sv':
        return <SE className="h-5 w-5" />;
      case 'en':
        return <GB className="h-5 w-5" />;
      default:
        return <GB className="h-5 w-5" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0 rounded-full">
          {getFlagIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLanguageChange('fi')}>
          <FI className="h-4 w-4 mr-2" />
          Suomi
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('sv')}>
          <SE className="h-4 w-4 mr-2" />
          Svenska
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
          <GB className="h-4 w-4 mr-2" />
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
