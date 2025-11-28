import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ProductFormValues } from "@/lib/validations/product";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductManagerTranslation } from "@/lib/translations/product-manager";

interface DigitalDeliveryTabProps {
  form: UseFormReturn<ProductFormValues>;
  productId?: number;
}

export function DigitalDeliveryTab({ form, productId }: DigitalDeliveryTabProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getProductManagerTranslation(lang, key);

  return (
    <Form {...form}>
      <div className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="is_digital"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t("form.fields.isDigital")}
                </FormLabel>
                <FormDescription>
                  Enable digital product delivery features
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

        {form.watch("is_digital") && (
          <>
            <FormField
              control={form.control}
              name="file_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.fileUrl")}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/file.zip"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Direct link to the digital file
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="external_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.externalUrl")}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t("form.placeholders.externalUrl")}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Link to external download location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="download_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.downloadLimit")}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      placeholder={t("form.placeholders.downloadLimit")}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave empty for unlimited downloads
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>
    </Form>
  );
}
