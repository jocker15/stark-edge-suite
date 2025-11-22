import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { ProductFormValues } from "@/lib/validations/product";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductManagerTranslation } from "@/lib/translations/product-manager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { convertToWebP } from "@/lib/imageOptimization";
import { useClipboardImagePaste, getPasteHintKey } from "@/hooks/useClipboardImagePaste";
import { ImageUploadZone } from "@/components/ui/image-upload-zone";

interface MediaTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export function MediaTab({ form }: MediaTabProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getProductManagerTranslation(lang, key);
  const { toast } = useToast();
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const optimizedImage = await convertToWebP(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85
      });

      const fileName = `${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, optimizedImage, {
          contentType: 'image/webp',
          cacheControl: '31536000'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("toasts.error"),
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingMain(true);
    try {
      const url = await uploadImage(file);
      const currentImages = form.getValues("image_urls");
      form.setValue("image_urls", [url, ...currentImages]);
      
      toast({
        title: t("toasts.uploadSuccess"),
      });
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: t("toasts.error"),
        description: error instanceof Error ? error.message : t("errors.uploadFile"),
        variant: "destructive",
      });
    } finally {
      setUploadingMain(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t("toasts.error"),
          description: `${file.name} is larger than 5MB`,
          variant: "destructive",
        });
        continue;
      }
    }

    setUploadingGallery(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      
      const currentGallery = form.getValues("gallery_urls");
      form.setValue("gallery_urls", [...currentGallery, ...urls]);
      
      toast({
        title: t("toasts.uploadSuccess"),
      });
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: t("toasts.error"),
        description: error instanceof Error ? error.message : t("errors.uploadFile"),
        variant: "destructive",
      });
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeMainImage = (url: string) => {
    const currentImages = form.getValues("image_urls");
    form.setValue("image_urls", currentImages.filter((img) => img !== url));
  };

  const removeGalleryImage = (url: string) => {
    const currentGallery = form.getValues("gallery_urls");
    form.setValue("gallery_urls", currentGallery.filter((img) => img !== url));
  };

  // Clipboard paste for main image
  const mainImagePaste = useClipboardImagePaste({
    onPaste: async (file) => {
      if (uploadingMain) return;
      setUploadingMain(true);
      try {
        const url = await uploadImage(file);
        const currentImages = form.getValues("image_urls");
        form.setValue("image_urls", [url, ...currentImages]);
      } finally {
        setUploadingMain(false);
      }
    },
    successMessage: t("form.messages.imagePasted"),
    errorMessages: {
      invalidType: t("form.messages.invalidImageType"),
      tooLarge: t("form.messages.imageTooLarge"),
    },
  });

  // Clipboard paste for gallery
  const galleryPaste = useClipboardImagePaste({
    onPaste: async (file) => {
      if (uploadingGallery) return;
      setUploadingGallery(true);
      try {
        const url = await uploadImage(file);
        const currentGallery = form.getValues("gallery_urls");
        form.setValue("gallery_urls", [...currentGallery, url]);
      } finally {
        setUploadingGallery(false);
      }
    },
    successMessage: t("form.messages.imagePasted"),
    errorMessages: {
      invalidType: t("form.messages.invalidImageType"),
      tooLarge: t("form.messages.imageTooLarge"),
    },
  });

  const pasteHint = t(getPasteHintKey("form.messages.pasteHint"));

  return (
    <Form {...form}>
      <div className="space-y-6 py-4">
        <div className="space-y-4">
          <div>
            <FormLabel>{t("form.fields.mainImage")}</FormLabel>
            <FormDescription>
              {t("form.messages.maxImageSize")}
            </FormDescription>
          </div>
          
          <ImageUploadZone
            isActive={mainImagePaste.isActive}
            onActivate={mainImagePaste.setActive}
            pasteHint={pasteHint}
          >
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={uploadingMain}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("main-image-upload")?.click();
                }}
              >
                {uploadingMain ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploadingMain ? "Uploading..." : t("form.actions.upload")}
              </Button>
              <input
                id="main-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMainImageUpload}
              />
            </div>
          </ImageUploadZone>

          {form.watch("image_urls").length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {form.watch("image_urls").map((url, index) => (
                <div key={url} className="relative group">
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMainImage(url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div>
            <FormLabel>{t("form.fields.gallery")}</FormLabel>
            <FormDescription>
              {t("form.messages.uploadFiles")}
            </FormDescription>
          </div>
          
          <ImageUploadZone
            isActive={galleryPaste.isActive}
            onActivate={galleryPaste.setActive}
            pasteHint={pasteHint}
          >
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={uploadingGallery}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("gallery-upload")?.click();
                }}
              >
                {uploadingGallery ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploadingGallery ? "Uploading..." : t("form.actions.upload")}
              </Button>
              <input
                id="gallery-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </div>
          </ImageUploadZone>

          {form.watch("gallery_urls").length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {form.watch("gallery_urls").map((url) => (
                <div key={url} className="relative group">
                  <img
                    src={url}
                    alt="Gallery"
                    className="w-full h-32 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeGalleryImage(url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="preview_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.fields.previewLink")}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t("form.placeholders.externalUrl")}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Optional: Link to external preview or demo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
