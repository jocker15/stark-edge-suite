import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<'en' | 'ru'>('en');

  const toggleLanguage = () => {
    setCurrentLang(prev => prev === 'en' ? 'ru' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="text-accent hover:text-accent hover:bg-accent/10 font-heading tracking-wider border border-accent/20 hover:border-accent/40 transition-all duration-300"
    >
      {currentLang.toUpperCase()}
    </Button>
  );
}