import * as React from "react";
import { Menu, X, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export function MobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
    }
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground hover:text-accent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Menu Panel - pushes content down */}
      {isOpen && (
        <div className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50 shadow-lg animate-slide-in-from-top">
          <div className="flex flex-col">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-lg font-heading text-gradient-primary">MENU</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMenu}
                className="text-muted-foreground hover:text-accent"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={lang === 'ru' ? 'Поиск товаров...' : 'Search products...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-2">
              <Link
                to="/verifications"
                onClick={closeMenu}
                className="block py-3 px-4 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all font-heading tracking-wide"
              >
                {lang === 'ru' ? 'ВЕРИФИКАЦИЯ' : 'VERIFICATIONS'}
              </Link>
              <Link
                to="/game-accounts"
                onClick={closeMenu}
                className="block py-3 px-4 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all font-heading tracking-wide"
              >
                {lang === 'ru' ? 'ИГРОВЫЕ АККАУНТЫ' : 'GAME ACCOUNTS'}
              </Link>
              <Link
                to="/digital-templates"
                onClick={closeMenu}
                className="block py-3 px-4 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all font-heading tracking-wide"
              >
                {lang === 'ru' ? 'ШАБЛОНЫ' : 'TEMPLATES'}
              </Link>
            </nav>

            {/* Theme and Language Switchers */}
            <div className="p-4 border-t border-border flex items-center justify-center space-x-4">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
