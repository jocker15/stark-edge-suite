import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2 } from "lucide-react";
import { getTranslation } from "@/lib/translations/settings-center";
import { getAllSettings } from "@/lib/settings";
import type { SiteSettings } from "@/types/settings";
import {
  GeneralSettings,
  BrandingSettings,
  PaymentSettings,
  EmailSettings,
  LanguageSettings,
} from "@/components/admin/settings";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: rolesLoading } = useRoles();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = (key: string) => getTranslation(lang, key);
  
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (authLoading || rolesLoading) return;
      
      if (!user) {
        navigate("/signin");
        return;
      }

      if (!isSuperAdmin) {
        navigate("/admin");
        toast({
          title: "Access Denied",
          description: "Only super admins can access settings",
          variant: "destructive",
        });
        return;
      }

      await loadSettings();
    }

    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, rolesLoading, isSuperAdmin, navigate]);

  const loadSettings = async () => {
    setLoading(true);
    const data = await getAllSettings();
    
    if (data) {
      setSettings(data);
    } else {
      toast({
        title: t('messages.loadError'),
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  if (authLoading || rolesLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin || !settings) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">{t('tabs.general')}</TabsTrigger>
            <TabsTrigger value="branding">{t('tabs.branding')}</TabsTrigger>
            <TabsTrigger value="payments">{t('tabs.payments')}</TabsTrigger>
            <TabsTrigger value="email">{t('tabs.email')}</TabsTrigger>
            <TabsTrigger value="language">{t('tabs.language')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSettings settings={settings.general} onUpdate={loadSettings} />
          </TabsContent>

          <TabsContent value="branding">
            <BrandingSettings settings={settings.branding} onUpdate={loadSettings} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentSettings settings={settings.payments} onUpdate={loadSettings} />
          </TabsContent>

          <TabsContent value="email">
            <EmailSettings settings={settings.email} onUpdate={loadSettings} />
          </TabsContent>

          <TabsContent value="language">
            <LanguageSettings settings={settings.language} onUpdate={loadSettings} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
