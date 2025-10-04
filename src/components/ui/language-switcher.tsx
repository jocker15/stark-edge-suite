import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageSwitcher() {
  const { lang, toggleLang } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLang}
      className="text-accent hover:text-accent hover:bg-accent/10 font-heading tracking-wider border border-accent/20 hover:border-accent/40 transition-all duration-300"
    >
      {lang.toUpperCase()}
    </Button>
  );
}