import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoriesManagerTranslation } from "@/lib/translations/categories-manager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Category } from "./AdminCategoriesNew";

const categoryFormSchema = z.object({
  name_en: z.string().min(1, "English name is required"),
  name_ru: z.string().min(1, "Russian name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  parent_id: z.string().nullable().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormDialogProps {
  category: Category | null;
  categories: Category[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryFormDialog({
  category,
  categories,
  open,
  onClose,
  onSuccess,
}: CategoryFormDialogProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getCategoriesManagerTranslation(lang, key);
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name_en: "",
      name_ru: "",
      slug: "",
      description: "",
      parent_id: null,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name_en: category.name_en,
        name_ru: category.name_ru,
        slug: category.slug,
        description: category.description || "",
        parent_id: category.parent_id,
      });
    } else {
      form.reset({
        name_en: "",
        name_ru: "",
        slug: "",
        description: "",
        parent_id: null,
      });
    }
  }, [category, form]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameEnChange = (value: string) => {
    form.setValue("name_en", value);
    if (!category) {
      const slug = generateSlug(value);
      form.setValue("slug", slug);
    }
  };

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (category) {
        const { error } = await supabase
          .from("product_categories")
          .update({
            name_en: values.name_en,
            name_ru: values.name_ru,
            slug: values.slug,
            description: values.description || null,
            parent_id: values.parent_id || null,
          })
          .eq("id", category.id);

        if (error) throw error;

        toast({
          title: t("messages.updateSuccess"),
        });
      } else {
        const maxSortOrder = categories.reduce(
          (max, cat) => Math.max(max, cat.sort_order),
          -1
        );

        const { error } = await supabase
          .from("product_categories")
          .insert({
            name_en: values.name_en,
            name_ru: values.name_ru,
            slug: values.slug,
            description: values.description || null,
            parent_id: values.parent_id || null,
            sort_order: maxSortOrder + 1,
          });

        if (error) throw error;

        toast({
          title: t("messages.createSuccess"),
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving category:", error);
      
      let errorMessage = t("messages.error");
      if (error instanceof Error) {
        if (error.message.includes("unique_category_slug")) {
          errorMessage = t("messages.duplicateSlug");
        } else if (error.message.includes("unique_category_name")) {
          errorMessage = t("messages.duplicateName");
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: t("messages.error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const availableParents = categories.filter((c) => c.id !== category?.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {category ? t("form.title.edit") : t("form.title.create")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        onChange={(e) => handleNameEnChange(e.target.value)}
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
                  <FormControl>
                    <Input
                      placeholder={t("form.placeholders.slug")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.placeholders.description")}
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.parent")}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("form.placeholders.parent")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t("noParent")}</SelectItem>
                      {availableParents.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {lang === "ru" ? cat.name_ru : cat.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancelButton")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t("saveButton")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
