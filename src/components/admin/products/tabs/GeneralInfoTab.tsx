import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { ProductFormValues } from "@/lib/validations/product";
import { generateSlug } from "@/lib/product-utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductManagerTranslation } from "@/lib/translations/product-manager";

interface GeneralInfoTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export function GeneralInfoTab({ form }: GeneralInfoTabProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getProductManagerTranslation(lang, key);

  const handleGenerateSlug = () => {
    const nameEn = form.getValues("name_en");
    if (nameEn) {
      form.setValue("slug", generateSlug(nameEn));
    }
  };

  return (
    <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.fields.nameEn")}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t("form.placeholders.nameEn")} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name_ru"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.fields.nameRu")}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t("form.placeholders.nameRu")} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.fields.slug")}</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input 
                    placeholder={t("form.placeholders.slug")} 
                    {...field} 
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGenerateSlug}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
              <FormDescription>
                {t("form.messages.generateSlug")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="description_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.fields.descriptionEn")}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={t("form.placeholders.descriptionEn")}
                    rows={5}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description_ru"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.fields.descriptionRu")}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={t("form.placeholders.descriptionRu")}
                    rows={5}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">SEO</h3>
          
          <FormField
            control={form.control}
            name="meta_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.fields.metaTitle")}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t("form.placeholders.metaTitle")}
                    maxLength={60}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0}/60 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meta_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.fields.metaDescription")}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={t("form.placeholders.metaDescription")}
                    maxLength={160}
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0}/160 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
    </div>
  );
}
