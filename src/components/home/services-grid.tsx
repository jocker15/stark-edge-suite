import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Gamepad2, FileText, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function ServicesGrid() {
  const { lang } = useLanguage();
  
  const services = [
    {
      icon: Shield,
      title: lang === 'ru' ? "Услуги верификации" : "Verification Services",
      description: lang === 'ru' 
        ? "Профессиональные решения для верификации бизнеса и частных лиц. Безопасные, быстрые и надежные процессы аутентификации."
        : "Professional verification solutions for businesses and individuals. Secure, fast, and reliable authentication processes.",
      href: "/verifications",
      gradient: "from-accent/20 to-accent/5",
      iconColor: "text-accent"
    },
    {
      icon: Gamepad2,
      title: lang === 'ru' ? "Игровые аккаунты" : "Game Accounts",
      description: lang === 'ru'
        ? "Премиум игровые аккаунты с проверенными учетными данными. Персонажи высокого уровня, редкие предметы и эксклюзивный контент."
        : "Premium gaming accounts with verified credentials. High-level characters, rare items, and exclusive content.",
      href: "/game-accounts",
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary"
    },
    {
      icon: FileText,
      title: lang === 'ru' ? "Цифровые шаблоны" : "Digital Templates",
      description: lang === 'ru'
        ? "Профессиональные шаблоны дизайна для современного бизнеса. Веб-сайты, презентации и цифровые активы готовые к использованию."
        : "Professional design templates for modern businesses. Websites, presentations, and digital assets ready to use.",
      href: "/digital-templates",
      gradient: "from-foreground/20 to-foreground/5",
      iconColor: "text-foreground"
    }
  ];

  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading mb-6 text-gradient-accent">
            {lang === 'ru' ? 'НАШИ УСЛУГИ' : 'OUR SERVICES'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {lang === 'ru' 
              ? 'Три основных направления бизнеса, предоставляющих премиум цифровые решения для вашего успеха'
              : 'Three core business areas providing premium digital solutions to help you succeed'
            }
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card 
                key={index}
                className="bg-card/50 backdrop-blur border-border/50 hover:border-accent/30 transition-all duration-500 group overflow-hidden relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <CardHeader className="relative">
                  <div className={`w-12 h-12 rounded-lg bg-card/80 flex items-center justify-center mb-4 group-hover:glow-accent transition-all duration-300`}>
                    <Icon className={`h-6 w-6 ${service.iconColor}`} />
                  </div>
                  <CardTitle className="font-heading text-xl text-foreground group-hover:text-accent transition-colors">
                    {service.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative">
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardContent>

                <CardFooter className="relative">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-accent hover:text-accent-foreground hover:bg-accent/20 font-heading tracking-wide group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300"
                    asChild
                  >
                    <a href={service.href}>
                      {lang === 'ru' ? 'УЗНАТЬ БОЛЬШЕ' : 'EXPLORE'}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}