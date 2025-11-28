import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations/settings-center";
import type { GeneralSettings as GeneralSettingsType } from "@/types/settings";
import { updateSetting } from "@/lib/settings";
import { Loader2 } from "lucide-react";

const generalSettingsSchema = z.object({
  site_name_en: z.string().min(1, "Site name is required"),
  site_name_ru: z.string().min(1, "Site name is required"),
  contact_email: z.string().email("Invalid email format").or(z.literal("")),
  contact_phone: z.string(),
  social_links: z.object({
    facebook: z.string().url("Invalid URL").or(z.literal("")),
    twitter: z.string().url("Invalid URL").or(z.literal("")),
    instagram: z.string().url("Invalid URL").or(z.literal("")),
    telegram: z.string().url("Invalid URL").or(z.literal("")),
    vk: z.string().url("Invalid URL").or(z.literal("")),
  }),
});

interface GeneralSettingsProps {
  settings: GeneralSettingsType;
  onUpdate: () => void;
}

export function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = (key: string) => getTranslation(lang, key);

  const form = useForm<GeneralSettingsType>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: settings,
  });

  const onSubmit = async (data: GeneralSettingsType) => {
    const success = await updateSetting('general', data);
    
    if (success) {
      toast({
        title: t('messages.saveSuccess'),
        variant: 'default',
      });
      onUpdate();
    } else {
      toast({
        title: t('messages.saveError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('general.title')}</CardTitle>
        <CardDescription>{t('general.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="site_name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.siteNameEn')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('general.placeholders.siteNameEn')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="site_name_ru"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.siteNameRu')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('general.placeholders.siteNameRu')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.contactEmail')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('general.placeholders.contactEmail')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.contactPhone')}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={t('general.placeholders.contactPhone')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('general.socialLinks')}</h3>
              
              <FormField
                control={form.control}
                name="social_links.facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.facebook')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('general.placeholders.facebook')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_links.twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.twitter')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('general.placeholders.twitter')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_links.instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.instagram')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('general.placeholders.instagram')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_links.telegram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.telegram')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('general.placeholders.telegram')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_links.vk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.vk')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('general.placeholders.vk')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {form.formState.isSubmitting ? t('actions.saving') : t('actions.save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
