
import { createContext, useContext, useState, ReactNode } from 'react';

type FooterContextType = {
  footerColor: string;
  setFooterColor: (color: string) => void;
};

const FooterContext = createContext<FooterContextType | undefined>(undefined);

export const FooterProvider = ({ children }: { children: ReactNode }) => {
  const [footerColor, setFooterColor] = useState('bg-reportronic-500');

  return (
    <FooterContext.Provider value={{ footerColor, setFooterColor }}>
      {children}
    </FooterContext.Provider>
  );
};

export const useFooter = (): FooterContextType => {
  const context = useContext(FooterContext);
  if (context === undefined) {
    throw new Error('useFooter must be used within a FooterProvider');
  }
  return context;
};
