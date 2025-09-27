import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  return (
    <header className="bg-card/50 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded glow-primary"></div>
          <span className="text-xl font-heading text-gradient-primary">
            DIGITAL EDGE
          </span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="/" className="text-foreground hover:text-accent transition-colors font-heading text-sm tracking-wide">
            HOME
          </a>
          <a href="/verifications" className="text-muted-foreground hover:text-accent transition-colors font-heading text-sm tracking-wide">
            VERIFICATIONS
          </a>
          <a href="/game-accounts" className="text-muted-foreground hover:text-accent transition-colors font-heading text-sm tracking-wide">
            GAME ACCOUNTS
          </a>
          <a href="/digital-templates" className="text-muted-foreground hover:text-accent transition-colors font-heading text-sm tracking-wide">
            TEMPLATES
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
            <ShoppingCart className="h-5 w-5" />
          </Button>
          
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