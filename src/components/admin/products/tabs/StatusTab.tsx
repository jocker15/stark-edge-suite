import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductFormValues } from "@/lib/validations/product";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductManagerTranslation } from "@/lib/translations/product-manager";

interface StatusTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export function StatusTab({ form }: StatusTabProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getProductManagerTranslation(lang, key);

  return (
    <Form {...form}>
      <div className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.fields.status")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">
                    {t("status.draft")}
                  </SelectItem>
                  <SelectItem value="active">
                    {t("status.active")}
                  </SelectItem>
                  <SelectItem value="archived">
                    {t("status.archived")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value === "draft" && "Product is hidden from storefront"}
                {field.value === "active" && "Product is visible and available for purchase"}
                {field.value === "archived" && "Product is archived and hidden"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
