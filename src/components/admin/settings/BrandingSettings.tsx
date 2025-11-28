import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations/settings-center";
import type { BrandingSettings as BrandingSettingsType } from "@/types/settings";
import { updateSetting, uploadBrandingAsset, deleteBrandingAsset } from "@/lib/settings";
import { Loader2, Upload, X } from "lucide-react";

const brandingSettingsSchema = z.object({
  logo_url: z.string(),
  favicon_url: z.string(),
  primary_color: z.string(),
  secondary_color: z.string(),
});

interface BrandingSettingsProps {
  settings: BrandingSettingsType;
  onUpdate: () => void;
}

export function BrandingSettings({ settings, onUpdate }: BrandingSettingsProps) {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = (key: string) => getTranslation(lang, key);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoContainerRef = useRef<HTMLDivElement>(null);
  const faviconContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<BrandingSettingsType>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: settings,
  });

  const getFileExtensionFromMimeType = (mimeType: string): string => {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/svg+xml': 'svg',
      'image/x-icon': 'ico',
    };
    return mimeMap[mimeType] || 'jpg';
  };

  const blobToFile = (blob: Blob, mimeType: string): File => {
    const extension = getFileExtensionFromMimeType(mimeType);
    const fileName = `branding-${crypto.randomUUID()}-${Date.now()}.${extension}`;
    return new File([blob], fileName, { type: mimeType });
  };

  const handlePasteEvent = async (e: ClipboardEvent, type: 'logo' | 'favicon') => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
          e.preventDefault();
          
          const file = blobToFile(blob, item.type);
          
          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: t('messages.uploadTooLarge'),
              variant: 'destructive',
            });
            return;
          }

          const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon;
          setUploading(true);

          try {
            const url = await uploadBrandingAsset(file, type);
            
            if (url) {
              const fieldName = type === 'logo' ? 'logo_url' : 'favicon_url';
              form.setValue(fieldName, url);
              
              toast({
                title: t('branding.imagePasted'),
                variant: 'default',
              });
            } else {
              toast({
                title: t('branding.uploadError'),
                variant: 'destructive',
              });
            }
          } catch (error) {
            toast({
              title: t('branding.uploadError'),
              variant: 'destructive',
            });
          } finally {
            setUploading(false);
          }
          return;
        }
      }
    }
  };

  useEffect(() => {
    const logoContainer = logoContainerRef.current;
    const faviconContainer = faviconContainerRef.current;

    const handleLogoPaste = (e: ClipboardEvent) => handlePasteEvent(e, 'logo');
    const handleFaviconPaste = (e: ClipboardEvent) => handlePasteEvent(e, 'favicon');

    if (logoContainer) {
      logoContainer.addEventListener('paste', handleLogoPaste);
    }
    if (faviconContainer) {
      faviconContainer.addEventListener('paste', handleFaviconPaste);
    }

    return () => {
      if (logoContainer) {
        logoContainer.removeEventListener('paste', handleLogoPaste);
      }
      if (faviconContainer) {
        faviconContainer.removeEventListener('paste', handleFaviconPaste);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: BrandingSettingsType) => {
    const success = await updateSetting('branding', data);
    
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

  const handleFileUpload = async (
    file: File,
    type: 'logo' | 'favicon'
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('messages.uploadTooLarge'),
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('messages.uploadInvalidType'),
        variant: 'destructive',
      });
      return;
    }

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);

    try {
      const url = await uploadBrandingAsset(file, type);
      
      if (url) {
        const fieldName = type === 'logo' ? 'logo_url' : 'favicon_url';
        form.setValue(fieldName, url);
        
        toast({
          title: t('branding.uploadSuccess'),
          variant: 'default',
        });
      } else {
        toast({
          title: t('branding.uploadError'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('branding.uploadError'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (type: 'logo' | 'favicon') => {
    const url = type === 'logo' ? form.getValues('logo_url') : form.getValues('favicon_url');
    
    if (!url) return;

    const success = await deleteBrandingAsset(url);
    
    if (success) {
      const fieldName = type === 'logo' ? 'logo_url' : 'favicon_url';
      form.setValue(fieldName, '');
      
      toast({
        title: t('branding.deleteSuccess'),
        variant: 'default',
      });
    } else {
      toast({
        title: t('branding.deleteError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('branding.title')}</CardTitle>
        <CardDescription>{t('branding.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4" ref={logoContainerRef} tabIndex={-1}>
                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('branding.logo')}</FormLabel>
                      <FormDescription>{t('branding.logoDescription')}</FormDescription>
                      <FormDescription className="text-xs text-muted-foreground">
                        {t('branding.pasteHint')}
                      </FormDescription>
                      
                      {field.value ? (
                        <div className="relative">
                          <div className="border rounded-lg p-4 bg-muted">
                            <img
                              src={field.value}
                              alt="Logo"
                              className="max-h-20 object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2"
                            onClick={() => handleFileDelete('logo')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <p className="text-sm text-muted-foreground mb-4">
                            {t('branding.noLogo')}
                          </p>
                          <label htmlFor="logo-upload">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={uploadingLogo}
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                              {uploadingLogo ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="mr-2 h-4 w-4" />
                              )}
                              {t('branding.uploadLogo')}
                            </Button>
                          </label>
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'logo');
                            }}
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4" ref={faviconContainerRef} tabIndex={-1}>
                <FormField
                  control={form.control}
                  name="favicon_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('branding.favicon')}</FormLabel>
                      <FormDescription>{t('branding.faviconDescription')}</FormDescription>
                      <FormDescription className="text-xs text-muted-foreground">
                        {t('branding.pasteHint')}
                      </FormDescription>
                      
                      {field.value ? (
                        <div className="relative">
                          <div className="border rounded-lg p-4 bg-muted">
                            <img
                              src={field.value}
                              alt="Favicon"
                              className="max-h-8 object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2"
                            onClick={() => handleFileDelete('favicon')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <p className="text-sm text-muted-foreground mb-4">
                            {t('branding.noFavicon')}
                          </p>
                          <label htmlFor="favicon-upload">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={uploadingFavicon}
                              onClick={() => document.getElementById('favicon-upload')?.click()}
                            >
                              {uploadingFavicon ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="mr-2 h-4 w-4" />
                              )}
                              {t('branding.uploadFavicon')}
                            </Button>
                          </label>
                          <input
                            id="favicon-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'favicon');
                            }}
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('branding.primaryColor')}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" {...field} className="w-20 h-10" />
                      </FormControl>
                      <Input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('branding.secondaryColor')}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" {...field} className="w-20 h-10" />
                      </FormControl>
                      <Input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
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
