import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Trash2 } from "lucide-react";
import { convertToWebP } from "@/lib/imageOptimization";

interface ProductFormProps {
  product?: any;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name_en: product?.name_en || "",
    name_ru: product?.name_ru || "",
    description_en: product?.description_en || "",
    description_ru: product?.description_ru || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    category: product?.category || "",
    document_type: product?.document_type || "",
    country: product?.country || "",
    preview_link: product?.preview_link || "",
    meta_title: product?.meta_title || "",
    meta_description: product?.meta_description || "",
  });

  useEffect(() => {
    if (product?.image_urls) {
      setExistingImages(product.image_urls);
    }
  }, [product]);

  async function uploadImages() {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      try {
        // Convert to WebP for better compression
        const optimizedImage = await convertToWebP(image, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85
        });

        const fileName = `${crypto.randomUUID()}.webp`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, optimizedImage, {
            contentType: 'image/webp',
            cacheControl: '31536000' // 1 year cache
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      } catch (error) {
        console.error('Error optimizing image:', error);
        // Fallback to original upload if optimization fails
        const fileExt = image.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, image);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      }
    }

    return uploadedUrls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrls = [...existingImages];

      if (images.length > 0) {
        const newUrls = await uploadImages();
        imageUrls = [...imageUrls, ...newUrls];
      }

      const productData = {
        ...formData,
        image_urls: imageUrls,
      };

      let error;
      if (product) {
        ({ error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id));
      } else {
        ({ error } = await supabase.from("products").insert([productData]));
      }

      if (error) throw error;

      toast({
        title: "Успешно",
        description: product ? "Товар обновлен" : "Товар добавлен",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить товар",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  }

  function removeExistingImage(url: string) {
    setExistingImages(existingImages.filter((img) => img !== url));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {product ? "Редактировать товар" : "Добавить товар"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Название (EN)</Label>
                <Input
                  required
                  value={formData.name_en}
                  onChange={(e) =>
                    setFormData({ ...formData, name_en: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Название (RU)</Label>
                <Input
                  required
                  value={formData.name_ru}
                  onChange={(e) =>
                    setFormData({ ...formData, name_ru: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Описание (EN)</Label>
              <Textarea
                value={formData.description_en}
                onChange={(e) =>
                  setFormData({ ...formData, description_en: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Описание (RU)</Label>
              <Textarea
                value={formData.description_ru}
                onChange={(e) =>
                  setFormData({ ...formData, description_ru: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Цена</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Остаток</Label>
                <Input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Категория</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="game-accounts">Game Accounts</SelectItem>
                  <SelectItem value="digital-templates">Digital Templates</SelectItem>
                  <SelectItem value="verifications">Verifications</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.category === "digital-templates" && (
              <>
                <div>
                  <Label>Тип документа</Label>
                  <Input
                    value={formData.document_type}
                    onChange={(e) =>
                      setFormData({ ...formData, document_type: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Страна</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div>
              <Label>Ссылка для превью</Label>
              <Input
                value={formData.preview_link}
                onChange={(e) =>
                  setFormData({ ...formData, preview_link: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">SEO оптимизация</h3>
              
              <div>
                <Label>Meta Title</Label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_title: e.target.value })
                  }
                  placeholder="Оптимизированный заголовок для поисковых систем"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Рекомендуется до 60 символов
                </p>
              </div>

              <div>
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.meta_description}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_description: e.target.value })
                  }
                  placeholder="Краткое описание для поисковых систем"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Рекомендуется до 160 символов
                </p>
              </div>
            </div>

            <div>
              <Label>Изображения</Label>
              {existingImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {existingImages.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeExistingImage(url)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
              />
              {images.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Выбрано файлов: {images.length}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
