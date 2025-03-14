
import React from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { fi, sv, gb } from 'country-flag-icons/react/3x2';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={language === 'fi' ? 'default' : 'ghost'}
        size="sm"
        className={`p-1 h-8 w-8 ${language === 'fi' ? 'bg-reportronic-500' : ''}`}
        onClick={() => setLanguage('fi')}
        aria-label="Switch to Finnish"
      >
        <span className="text-xs">FI</span>
      </Button>
      <Button
        variant={language === 'sv' ? 'default' : 'ghost'}
        size="sm"
        className={`p-1 h-8 w-8 ${language === 'sv' ? 'bg-reportronic-500' : ''}`}
        onClick={() => setLanguage('sv')}
        aria-label="Switch to Swedish"
      >
        <span className="text-xs">SV</span>
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        className={`p-1 h-8 w-8 ${language === 'en' ? 'bg-reportronic-500' : ''}`}
        onClick={() => setLanguage('en')}
        aria-label="Switch to English"
      >
        <span className="text-xs">EN</span>
      </Button>
    </div>
  );
};

export default LanguageSwitcher;
