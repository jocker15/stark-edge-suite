import { useState, useEffect, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, Trash2, Download, Loader2 } from "lucide-react";
import { ProductFormValues } from "@/lib/validations/product";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductManagerTranslation } from "@/lib/translations/product-manager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { formatFileSize } from "@/lib/product-utils";

type ProductFile = Tables<"product_files">;

interface DigitalDeliveryTabProps {
  form: UseFormReturn<ProductFormValues>;
  productId?: number;
}

export function DigitalDeliveryTab({ form, productId }: DigitalDeliveryTabProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getProductManagerTranslation(lang, key);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [productFiles, setProductFiles] = useState<ProductFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProductFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProductFiles = async () => {
    if (!productId) return;
    
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from("product_files")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProductFiles(data || []);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !productId) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${productId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("digital-products")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from("product_files")
          .insert({
            product_id: productId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
          });

        if (dbError) throw dbError;
      }

      toast({
        title: t("toasts.uploadSuccess"),
      });

      loadProductFiles();
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: t("toasts.error"),
        description: error instanceof Error ? error.message : t("errors.uploadFile"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (file: ProductFile) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("digital-products")
        .remove([file.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("product_files")
        .delete()
        .eq("id", file.id);

      if (dbError) throw dbError;

      toast({
        title: t("toasts.productDeleted"),
      });

      loadProductFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: t("toasts.error"),
        description: error instanceof Error ? error.message : t("errors.deleteProduct"),
        variant: "destructive",
      });
    }
  };

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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upload Files</h3>
              
              {productId ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {uploading ? "Uploading..." : t("form.actions.upload")}
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <p className="text-sm text-muted-foreground">
                      {t("form.messages.maxFileSize")}
                    </p>
                  </div>

                  {loadingFiles ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : productFiles.length > 0 ? (
                    <div className="space-y-2">
                      {productFiles.map((file) => (
                        <Card key={file.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{file.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.file_size || 0)} • {file.file_type}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("confirmations.deleteFile.title")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("confirmations.deleteFile.description")}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t("confirmations.deleteFile.cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteFile(file)}
                                    >
                                      {t("confirmations.deleteFile.confirm")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No files uploaded yet
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Save the product first to upload files
                </p>
              )}
            </div>

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
