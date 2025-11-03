import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoriesManagerTranslation } from "@/lib/translations/categories-manager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search } from "lucide-react";
import { CategoriesDataTable } from "./CategoriesDataTable";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

export interface Category {
  id: string;
  name_en: string;
  name_ru: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  active_products_count: number;
  total_products_count: number;
}

export function AdminCategoriesNew() {
  const { lang } = useLanguage();
  const t = (key: string) => getCategoriesManagerTranslation(lang, key);
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_categories_with_counts");
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: t("messages.error"),
        description: t("messages.loadError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setSelectedCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleFormSuccess = () => {
    loadCategories();
    setFormOpen(false);
    setSelectedCategory(null);
  };

  const handleDeleteSuccess = () => {
    loadCategories();
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  const handleReorder = async (newOrder: { id: string; sort_order: number }[]) => {
    try {
      const { error } = await supabase.rpc("update_category_sort_orders", {
        category_orders: newOrder,
      });

      if (error) throw error;

      toast({
        title: t("messages.reorderSuccess"),
      });

      loadCategories();
    } catch (error) {
      console.error("Error reordering categories:", error);
      toast({
        title: t("messages.error"),
        description: error instanceof Error ? error.message : "Failed to reorder categories",
        variant: "destructive",
      });
    }
  };

  const filteredCategories = categories.filter((category) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      category.name_en.toLowerCase().includes(query) ||
      category.name_ru.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query) ||
      (category.description && category.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t("createButton")}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <CategoriesDataTable
              categories={filteredCategories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          )}
        </CardContent>
      </Card>

      <CategoryFormDialog
        category={selectedCategory}
        categories={categories}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedCategory(null);
        }}
        onSuccess={handleFormSuccess}
      />

      <DeleteCategoryDialog
        category={selectedCategory}
        categories={categories.filter((c) => c.id !== selectedCategory?.id)}
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedCategory(null);
        }}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
