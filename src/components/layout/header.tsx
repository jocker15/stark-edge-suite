import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useState, FormEvent } from "react";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-card/50 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-primary rounded glow-primary"></div>
          <span className="text-xl font-heading text-gradient-primary">
            DIGITAL EDGE
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8 flex-shrink-0">
          <Link to="/verifications" className="text-muted-foreground hover:text-accent transition-colors font-heading text-sm tracking-wide">
            VERIFICATIONS
          </Link>
          <Link to="/game-accounts" className="text-muted-foreground hover:text-accent transition-colors font-heading text-sm tracking-wide">
            GAME ACCOUNTS
          </Link>
          <Link to="/digital-templates" className="text-muted-foreground hover:text-accent transition-colors font-heading text-sm tracking-wide">
            TEMPLATES
          </Link>
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50 w-full"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent relative">
              <ShoppingCart className="h-5 w-5" />
              {getItemCount() > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full text-xs flex items-center justify-center"
                >
                  {getItemCount()}
                </Badge>
              )}
            </Button>
          </Link>
          
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-accent"
                onClick={() => navigate("/account")}
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-accent"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/signin">
                <Button variant="outline" size="sm" className="text-foreground border-border/50 hover:bg-accent/50">
                  SIGN IN
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  SIGN UP
                </Button>
              </Link>
            </>
          )}
          
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}