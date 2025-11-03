import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { PublicSettings } from "@/types/settings";
import { getPublicSettings } from "@/lib/settings";

interface SettingsContextType {
  settings: PublicSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    const data = await getPublicSettings();
    if (data) {
      setSettings(data);
      updateDocumentTitle(data);
      updateFavicon(data);
    }
    setLoading(false);
  };

  const updateDocumentTitle = (settings: PublicSettings) => {
    const defaultLang = settings.language?.default_language || 'en';
    const siteName = defaultLang === 'ru' 
      ? settings.general?.site_name_ru 
      : settings.general?.site_name_en;
    
    if (siteName) {
      document.title = siteName;
    }
  };

  const updateFavicon = (settings: PublicSettings) => {
    if (settings.branding?.favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.branding.favicon_url;
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
