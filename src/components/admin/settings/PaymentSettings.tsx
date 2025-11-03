import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations/settings-center";
import type { PaymentSettings as PaymentSettingsType } from "@/types/settings";
import { updateSetting, testPaymentConnection } from "@/lib/settings";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

const paymentSettingsSchema = z.object({
  cryptocloud_shop_id: z.string(),
  cryptocloud_api_key: z.string(),
  mode: z.enum(['test', 'production']),
  default_currency: z.string(),
  enabled: z.boolean(),
});

interface PaymentSettingsProps {
  settings: PaymentSettingsType;
  onUpdate: () => void;
}

export function PaymentSettings({ settings, onUpdate }: PaymentSettingsProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);

  const form = useForm<PaymentSettingsType>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: settings,
  });

  const onSubmit = async (data: PaymentSettingsType) => {
    const success = await updateSetting('payments', data);
    
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

  const handleTestConnection = async () => {
    const shopId = form.getValues('cryptocloud_shop_id');
    const apiKey = form.getValues('cryptocloud_api_key');

    if (!shopId || !apiKey) {
      toast({
        title: t('validation.shopIdRequired'),
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await testPaymentConnection(shopId, apiKey);
    setTestResult(result);

    if (result.success) {
      toast({
        title: t('payments.testSuccess'),
        variant: 'default',
      });
    } else {
      toast({
        title: t('payments.testError'),
        description: result.message,
        variant: 'destructive',
      });
    }

    setTesting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('payments.title')}</CardTitle>
        <CardDescription>{t('payments.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Alert>
              <AlertDescription>{t('payments.warning')}</AlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="cryptocloud_shop_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.cryptocloudShopId')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('payments.placeholders.shopId')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cryptocloud_api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.cryptocloudApiKey')}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder={t('payments.placeholders.apiKey')}
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
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payments.mode')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="test">{t('payments.modeTest')}</SelectItem>
                        <SelectItem value="production">{t('payments.modeProduction')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payments.defaultCurrency')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="RUB">RUB</SelectItem>
                        <SelectItem value="UAH">UAH</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('payments.enabled')}</FormLabel>
                    <FormDescription>
                      Enable payment processing on the storefront
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {testing ? t('payments.testInProgress') : t('payments.testConnection')}
              </Button>

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
