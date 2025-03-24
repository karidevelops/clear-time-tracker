
import { createContext, useContext, useState, ReactNode } from 'react';

type BannerContextType = {
  bannerText: string;
  setBannerText: (text: string) => void;
};

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export const BannerProvider = ({ children }: { children: ReactNode }) => {
  const [bannerText, setBannerText] = useState('Reportronic');

  return (
    <BannerContext.Provider value={{ bannerText, setBannerText }}>
      {children}
    </BannerContext.Provider>
  );
};

export const useBanner = (): BannerContextType => {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
};
