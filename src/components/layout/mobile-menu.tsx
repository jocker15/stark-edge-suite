import * as React from "react";
import { Menu, X, Search, ShoppingCart, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function MobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: lang === 'ru' ? "Вы вышли" : "Signed out",
        description: lang === 'ru' ? "Вы успешно вышли из системы" : "You have been successfully signed out"
      });
      navigate("/");
      setIsOpen(false);
    } catch {
      toast({
        title: lang === 'ru' ? "Ошибка" : "Error",
        description: lang === 'ru' ? "Не удалось выйти" : "Failed to sign out",
        variant: "destructive"
      });
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
            <nav className="p-4 space-y-2" role="menu">
              <Link
                to="/verifications"
                onClick={closeMenu}
                className="block py-3 px-4 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all font-heading tracking-wide"
                role="menuitem"
              >
                {lang === 'ru' ? 'ВЕРИФИКАЦИЯ' : 'VERIFICATIONS'}
              </Link>
              <Link
                to="/game-accounts"
                onClick={closeMenu}
                className="block py-3 px-4 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all font-heading tracking-wide"
                role="menuitem"
              >
                {lang === 'ru' ? 'ИГРОВЫЕ АККАУНТЫ' : 'GAME ACCOUNTS'}
              </Link>
              <Link
                to="/digital-templates"
                onClick={closeMenu}
                className="block py-3 px-4 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all font-heading tracking-wide"
                role="menuitem"
              >
                {lang === 'ru' ? 'ШАБЛОНЫ' : 'TEMPLATES'}
              </Link>
              
              {/* Cart Link */}
              <Link
                to="/cart"
                onClick={closeMenu}
                className="flex items-center justify-between py-3 px-4 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all font-heading tracking-wide"
                role="menuitem"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {lang === 'ru' ? 'КОРЗИНА' : 'CART'}
                </span>
                {getItemCount() > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1 rounded-full text-xs flex items-center justify-center">
                    {getItemCount() > 99 ? '99+' : getItemCount()}
                  </Badge>
                )}
              </Link>
            </nav>

            {/* Auth Section */}
            <div className="p-4 border-t border-border space-y-2">
              {user ? (
                <>
                  <Link
                    to="/account"
                    onClick={closeMenu}
                    className="flex items-center gap-2 py-3 px-4 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
                  >
                    <User className="h-5 w-5" />
                    {lang === 'ru' ? 'Мой аккаунт' : 'My Account'}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 py-3 px-4 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    {lang === 'ru' ? 'Выйти' : 'Sign Out'}
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to="/signin" onClick={closeMenu} className="flex-1">
                    <Button variant="outline" className="w-full">
                      {lang === 'ru' ? 'Войти' : 'Sign In'}
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={closeMenu} className="flex-1">
                    <Button className="w-full bg-gradient-primary">
                      {lang === 'ru' ? 'Регистрация' : 'Sign Up'}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

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
