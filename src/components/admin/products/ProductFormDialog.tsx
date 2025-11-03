import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { ProductFormValues, productFormSchema } from "@/lib/validations/product";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductManagerTranslation } from "@/lib/translations/product-manager";
import { GeneralInfoTab } from "./tabs/GeneralInfoTab";
import { PricingTab } from "./tabs/PricingTab";
import { CategorizationTab } from "./tabs/CategorizationTab";
import { DigitalDeliveryTab } from "./tabs/DigitalDeliveryTab";
import { MediaTab } from "./tabs/MediaTab";
import { GeographyTab } from "./tabs/GeographyTab";
import { StatusTab } from "./tabs/StatusTab";

type Product = Tables<"products">;

interface ProductFormDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductFormDialog({ 
  product, 
  open, 
  onClose, 
  onSuccess 
}: ProductFormDialogProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getProductManagerTranslation(lang, key);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name_en: "",
      name_ru: "",
      description_en: "",
      description_ru: "",
      slug: "",
      sku: "",
      price: 0,
      old_price: null,
      currency: "USD",
      category: null,
      tags: [],
      is_digital: true,
      file_url: null,
      external_url: null,
      download_limit: null,
      country: null,
      state: null,
      document_type: null,
      status: "draft",
      stock: 1000,
      meta_title: "",
      meta_description: "",
      image_urls: [],
      gallery_urls: [],
      preview_link: null,
    },
  });

  useEffect(() => {
    if (product) {
      const categoryId = (product as unknown as { category_id?: string }).category_id;
      
      form.reset({
        name_en: product.name_en || "",
        name_ru: product.name_ru || "",
        description_en: product.description_en || "",
        description_ru: product.description_ru || "",
        slug: product.slug || "",
        sku: product.sku || "",
        price: product.price,
        old_price: product.old_price,
        currency: (product.currency as "USD" | "EUR" | "RUB") || "USD",
        category: categoryId || product.category,
        tags: (product.tags as string[]) || [],
        is_digital: product.is_digital ?? true,
        file_url: product.file_url,
        external_url: product.external_url,
        download_limit: product.download_limit,
        country: product.country,
        state: product.state,
        document_type: product.document_type,
        status: (product.status as "active" | "draft" | "archived") || "draft",
        stock: product.stock,
        meta_title: product.meta_title || "",
        meta_description: product.meta_description || "",
        image_urls: (product.image_urls as string[]) || [],
        gallery_urls: (product.gallery_urls as string[]) || [],
        preview_link: product.preview_link,
      });
    } else {
      form.reset();
    }
  }, [product, form]);

  const onSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    try {
      const productData: Record<string, unknown> = {
        ...values,
        image_urls: values.image_urls,
        gallery_urls: values.gallery_urls,
        tags: values.tags,
        category_id: values.category || null,
      };

      delete productData.category;

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);

        if (error) throw error;

        toast({
          title: t("toasts.productUpdated"),
        });
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData]);

        if (error) throw error;

        toast({
          title: t("toasts.productCreated"),
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: t("toasts.error"),
        description: error instanceof Error ? error.message : t("errors.saveProduct"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? t("editProduct") : t("addProduct")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general">{t("form.tabs.general")}</TabsTrigger>
              <TabsTrigger value="pricing">{t("form.tabs.pricing")}</TabsTrigger>
              <TabsTrigger value="categorization">{t("form.tabs.categorization")}</TabsTrigger>
              <TabsTrigger value="digital">{t("form.tabs.digital")}</TabsTrigger>
              <TabsTrigger value="media">{t("form.tabs.media")}</TabsTrigger>
              <TabsTrigger value="geography">{t("form.tabs.geography")}</TabsTrigger>
              <TabsTrigger value="status">{t("form.tabs.status")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <GeneralInfoTab form={form} />
            </TabsContent>

            <TabsContent value="pricing">
              <PricingTab form={form} />
            </TabsContent>

            <TabsContent value="categorization">
              <CategorizationTab form={form} />
            </TabsContent>

            <TabsContent value="digital">
              <DigitalDeliveryTab form={form} productId={product?.id} />
            </TabsContent>

            <TabsContent value="media">
              <MediaTab form={form} />
            </TabsContent>

            <TabsContent value="geography">
              <GeographyTab form={form} />
            </TabsContent>

            <TabsContent value="status">
              <StatusTab form={form} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("form.actions.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t("form.actions.saving") : t("form.actions.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
