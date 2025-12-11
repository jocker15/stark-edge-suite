import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

export function HeroSection() {
  const { lang } = useLanguage();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  useEffect(() => {
    setShouldAnimate(true);
  }, []);
  
  return (
    <section className="relative py-24 px-4 overflow-hidden bg-slate-900">
      
      <div className="container mx-auto text-center relative z-10">
        <div className="inline-flex items-center space-x-2 bg-card/30 backdrop-blur border border-accent/20 rounded-full px-6 py-2 mb-8 animate-fade-in">
          <Zap className="h-4 w-4 text-accent" />
          <span className="text-sm font-heading tracking-wide text-accent">
            {lang === 'ru' ? 'ЦИФРОВЫЕ РЕШЕНИЯ НОВОГО ПОКОЛЕНИЯ' : 'NEXT-GEN DIGITAL SOLUTIONS'}
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-heading mb-6 leading-tight animate-slide-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
          <span className={`text-gradient-primary text-hover-glow text-glitch-hover inline-block ${shouldAnimate ? 'animate-glitch-once' : ''}`}>
            {lang === 'ru' ? 'STARK' : 'STARK'}
          </span>
          <br />
          <span className="text-gradient-accent text-hover-glow-accent text-glitch-hover inline-block">{lang === 'ru' ? 'INCORP.' : 'INCORP.'}</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-slide-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
          {lang === 'ru'
            ? 'Познайте будущее цифровой коммерции с передовыми услугами верификации, премиум игровыми аккаунтами и профессиональными цифровыми шаблонами.'
            : 'Experience the future of digital commerce with cutting-edge verification services, premium game accounts, and professional digital templates.'
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
          <Button 
            asChild
            size="lg" 
            className="bg-gradient-primary hover:opacity-90 hover:scale-105 hover:glow-primary text-primary-foreground font-heading tracking-wide transition-all duration-300"
          >
            <Link to="/verifications">
              {lang === 'ru' ? 'НАШИ УСЛУГИ' : 'EXPLORE SERVICES'}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline" 
            size="lg"
            className="border-accent text-accent hover:bg-accent/10 hover:scale-105 hover:border-accent hover:glow-accent font-heading tracking-wide transition-all duration-300"
          >
            <Link to="/digital-templates">
              {lang === 'ru' ? 'СМОТРЕТЬ ТОВАРЫ' : 'VIEW PRODUCTS'}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}