
import { createContext, useContext, useState, ReactNode } from 'react';

type FooterTextContextType = {
  footerText: string;
  setFooterText: (text: string) => void;
};

const FooterTextContext = createContext<FooterTextContextType | undefined>(undefined);

export const FooterTextProvider = ({ children }: { children: ReactNode }) => {
  const [footerText, setFooterText] = useState('inspired by');

  return (
    <FooterTextContext.Provider value={{ footerText, setFooterText }}>
      {children}
    </FooterTextContext.Provider>
  );
};

export const useFooterText = (): FooterTextContextType => {
  const context = useContext(FooterTextContext);
  if (context === undefined) {
    throw new Error('useFooterText must be used within a FooterTextProvider');
  }
  return context;
};
