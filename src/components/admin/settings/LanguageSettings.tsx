import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations/settings-center";
import type { LanguageSettings as LanguageSettingsType } from "@/types/settings";
import { updateSetting } from "@/lib/settings";
import { Loader2 } from "lucide-react";

const languageSettingsSchema = z.object({
  active_locales: z.array(z.string()).min(1, "At least one language must be active"),
  default_language: z.string(),
});

interface LanguageSettingsProps {
  settings: LanguageSettingsType;
  onUpdate: () => void;
}

const AVAILABLE_LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
];

export function LanguageSettings({ settings, onUpdate }: LanguageSettingsProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);

  const form = useForm<LanguageSettingsType>({
    resolver: zodResolver(languageSettingsSchema),
    defaultValues: settings,
  });

  const onSubmit = async (data: LanguageSettingsType) => {
    if (!data.active_locales.includes(data.default_language)) {
      toast({
        title: "Invalid Configuration",
        description: "Default language must be one of the active languages",
        variant: 'destructive',
      });
      return;
    }

    const success = await updateSetting('language', data);
    
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
        <CardTitle>{t('language.title')}</CardTitle>
        <CardDescription>{t('language.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="active_locales"
              render={() => (
                <FormItem>
                  <FormLabel>{t('language.activeLocales')}</FormLabel>
                  <FormDescription>{t('language.localeDescription')}</FormDescription>
                  <div className="space-y-2">
                    {AVAILABLE_LOCALES.map((locale) => (
                      <FormField
                        key={locale.value}
                        control={form.control}
                        name="active_locales"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={locale.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(locale.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, locale.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== locale.value
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {locale.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('language.defaultLanguage')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AVAILABLE_LOCALES.filter((locale) => 
                        form.watch('active_locales')?.includes(locale.value)
                      ).map((locale) => (
                        <SelectItem key={locale.value} value={locale.value}>
                          {locale.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only active languages are available as default
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
