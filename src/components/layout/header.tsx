import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useState, FormEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ScrollProgress } from "@/components/ui/scroll-progress";
export function Header() {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    getItemCount
  } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const { lang } = useLanguage();
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: lang === 'ru' ? "Вы вышли" : "Signed out",
        description: lang === 'ru' ? "Вы успешно вышли из системы" : "You have been successfully signed out"
      });
      navigate("/");
    } catch (error) {
      toast({
        title: lang === 'ru' ? "Ошибка" : "Error",
        description: lang === 'ru' ? "Не удалось выйти" : "Failed to sign out",
        variant: "destructive"
      });
    }
  };
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  return <>
      {/* Skip Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        {lang === 'ru' ? 'Перейти к основному содержимому' : 'Skip to main content'}
      </a>
      
      {/* Scroll Progress Bar */}
      <ScrollProgress />
      
      {/* Telegram Banner */}
      <a href="https://t.me/+PEK5gWmsPxY4NGU6" target="_blank" rel="noopener noreferrer" className="block bg-gradient-accent hover:opacity-90 transition-opacity">
        <div className="container mx-auto px-4 py-2 text-center">
          <span className="text-sm font-heading tracking-wider text-black">
            {lang === 'ru' ? 'ПРИСОЕДИНЯЙТЕСЬ К НАШЕМУ TELEGRAM КАНАЛУ' : 'JOIN OUR TELEGRAM CHANNEL'}
          </span>
        </div>
      </a>

      <header className="bg-card/50 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 hover:opacity-100 transition-all flex-shrink-0 group">
          {/* Logo container with red background */}
          <div className="logo-icon relative flex items-center gap-1 bg-primary px-2 py-1 rounded">
            {/* Triangle with S */}
            <svg 
              viewBox="0 0 40 44" 
              className="w-8 h-9"
              fill="none"
              style={{ filter: 'drop-shadow(0 0 4px hsl(var(--accent)))' }}
            >
              {/* Inverted triangle outline */}
              <path 
                d="M2 2 L38 2 L20 42 Z" 
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
              />
              {/* Stylized S letter - futuristic lightning style */}
              <path 
                d="M12 8 L28 8 L28 12 L18 12 L18 18 L28 18 L28 32 L12 32 L12 28 L22 28 L22 22 L12 22 Z" 
                fill="hsl(var(--accent))"
                style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' }}
              />
              {/* Black wedge cutout in center of S */}
              <path 
                d="M18 19 L22 19 L20 24 Z" 
                fill="hsl(var(--primary))"
              />
            </svg>
            {/* "stark" text below - italic style */}
            <span 
              className="text-accent font-bold text-sm italic tracking-wide"
              style={{ 
                textShadow: '0 0 6px hsl(var(--accent))',
                fontFamily: 'system-ui, sans-serif'
              }}
            >
              stark
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8 flex-shrink-0">
          <Link to="/verifications" className="text-muted-foreground hover:text-accent transition-colors font-heading text-sm tracking-wide">
            {lang === 'ru' ? 'ВЕРИФИКАЦИЯ' : 'VERIFICATIONS'}
          </Link>
          <Link to="/game-accounts" className="text-muted-foreground hover:text-accent transition-colors font-heading text-sm tracking-wide">
            {lang === 'ru' ? 'ИГРОВЫЕ АККАУНТЫ' : 'GAME ACCOUNTS'}
          </Link>
          <Link to="/digital-templates" className="text-muted-foreground hover:text-accent transition-colors font-heading text-sm tracking-wide">
            {lang === 'ru' ? 'ШАБЛОНЫ' : 'TEMPLATES'}
          </Link>
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder={lang === 'ru' ? 'Поиск товаров...' : 'Search products...'} 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-10 bg-card/50 border-border/50 w-full" 
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link to="/cart" className="hidden sm:block">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent hover:scale-110 transition-transform relative">
              <ShoppingCart className="h-5 w-5" />
              {getItemCount() > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full text-xs flex items-center justify-center animate-scale-in">
                  {getItemCount() > 99 ? '99+' : getItemCount()}
                </Badge>}
            </Button>
          </Link>
          
          {user ? <>
              <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-accent hover:scale-110 transition-transform" onClick={() => navigate("/account")}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-accent hover:scale-110 transition-transform" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </> : <>
              <Link to="/signin" className="hidden md:block">
                <Button variant="outline" size="sm" className="text-foreground border-border/50 hover:bg-accent/50 hover:scale-105 transition-transform">
                  {lang === 'ru' ? 'ВОЙТИ' : 'SIGN IN'}
                </Button>
              </Link>
              <Link to="/signup" className="hidden md:block">
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 hover:scale-105 transition-all text-primary-foreground">
                  {lang === 'ru' ? 'РЕГИСТРАЦИЯ' : 'SIGN UP'}
                </Button>
              </Link>
            </>}
          
          <div className="hidden md:flex items-center space-x-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
          
          <MobileMenu />
        </div>
      </div>
    </header>
    </>;
}