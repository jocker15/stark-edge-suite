import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

export function ThemeSwitcher() {
  const { setTheme } = useTheme();
  const { lang } = useLanguage();

  const translations = {
    en: {
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    ru: {
      light: "Светлая",
      dark: "Тёмная",
      system: "Системная",
    },
  };

  const t = translations[lang];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-accent hover:text-accent hover:bg-accent/10 border border-accent/20 hover:border-accent/40 transition-all duration-300"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border/50">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="cursor-pointer hover:bg-accent/10"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>{t.light}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="cursor-pointer hover:bg-accent/10"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>{t.dark}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="cursor-pointer hover:bg-accent/10"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>{t.system}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
