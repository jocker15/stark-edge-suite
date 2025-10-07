import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export function HeroSection() {
  const { lang } = useLanguage();
  
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto text-center relative z-10">
        <div className="inline-flex items-center space-x-2 bg-card/30 backdrop-blur border border-accent/20 rounded-full px-6 py-2 mb-8">
          <Zap className="h-4 w-4 text-accent" />
          <span className="text-sm font-heading tracking-wide text-accent">
            {lang === 'ru' ? 'ЦИФРОВЫЕ РЕШЕНИЯ НОВОГО ПОКОЛЕНИЯ' : 'NEXT-GEN DIGITAL SOLUTIONS'}
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-heading mb-6 leading-tight">
          <span className="text-gradient-primary">{lang === 'ru' ? 'STARK' : 'STARK'}</span>
          <br />
          <span className="text-gradient-accent">{lang === 'ru' ? 'INCORP.' : 'INCORP.'}</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
          {lang === 'ru'
            ? 'Познайте будущее цифровой коммерции с передовыми услугами верификации, премиум игровыми аккаунтами и профессиональными цифровыми шаблонами.'
            : 'Experience the future of digital commerce with cutting-edge verification services, premium game accounts, and professional digital templates.'
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            asChild
            size="lg" 
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-heading tracking-wide glow-primary transition-all duration-300"
          >
            <Link to="/verifications">
              {lang === 'ru' ? 'НАШИ УСЛУГИ' : 'EXPLORE SERVICES'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline" 
            size="lg"
            className="border-accent text-accent hover:bg-accent/10 font-heading tracking-wide transition-all duration-300"
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