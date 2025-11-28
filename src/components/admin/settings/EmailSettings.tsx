import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations/settings-center";
import type { EmailSettings as EmailSettingsType } from "@/types/settings";
import { updateSetting, sendTestEmail } from "@/lib/settings";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const emailSettingsSchema = z.object({
  resend_api_key: z.string(),
  sender_email: z.string().email("Invalid email format").or(z.literal("")),
  sender_name: z.string(),
  template_ids: z.object({
    welcome: z.string(),
    password_reset: z.string(),
    order_confirmation: z.string(),
    order_shipped: z.string(),
  }),
});

interface EmailSettingsProps {
  settings: EmailSettingsType;
  onUpdate: () => void;
}

export function EmailSettings({ settings, onUpdate }: EmailSettingsProps) {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = (key: string) => getTranslation(lang, key);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");

  const form = useForm<EmailSettingsType>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: settings,
  });

  const onSubmit = async (data: EmailSettingsType) => {
    const success = await updateSetting('email', data);
    
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

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast({
        title: t('messages.invalidEmail'),
        variant: 'destructive',
      });
      return;
    }

    const apiKey = form.getValues('resend_api_key');
    const senderEmail = form.getValues('sender_email');
    const senderName = form.getValues('sender_name');

    if (!apiKey || !senderEmail) {
      toast({
        title: t('validation.apiKeyRequired'),
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await sendTestEmail(apiKey, senderEmail, senderName, testEmailAddress);
    setTestResult(result);

    if (result.success) {
      toast({
        title: t('email.testSuccess'),
        variant: 'default',
      });
      setTestEmailOpen(false);
    } else {
      toast({
        title: t('email.testError'),
        description: result.message,
        variant: 'destructive',
      });
    }

    setTesting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('email.title')}</CardTitle>
        <CardDescription>{t('email.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Alert>
              <AlertDescription>{t('email.warning')}</AlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="resend_api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email.resendApiKey')}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder={t('email.placeholders.apiKey')}
                        {...field}
                        className="flex-1"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sender_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email.senderEmail')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('email.placeholders.senderEmail')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sender_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email.senderName')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('email.placeholders.senderName')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('email.templateIds')}</h3>
              
              <FormField
                control={form.control}
                name="template_ids.welcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email.welcome')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('email.placeholders.templateId')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template_ids.password_reset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email.passwordReset')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('email.placeholders.templateId')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template_ids.order_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email.orderConfirmation')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('email.placeholders.templateId')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template_ids.order_shipped"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email.orderShipped')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('email.placeholders.templateId')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    {t('email.testEmail')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('email.testEmail')}</DialogTitle>
                    <DialogDescription>
                      Send a test email to verify your configuration
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <FormLabel>{t('email.testEmailAddress')}</FormLabel>
                      <Input
                        type="email"
                        placeholder={t('email.placeholders.testEmail')}
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleSendTestEmail}
                      disabled={testing}
                    >
                      {testing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {testing ? t('email.testInProgress') : t('actions.test')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {testResult && (
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
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
