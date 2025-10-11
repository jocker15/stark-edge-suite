import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload } from "lucide-react";
import { ProductForm } from "./ProductForm";
import { ProductsTable } from "./ProductsTable";
import { CSVImport } from "./CSVImport";

interface Product {
  id: number;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  price: number;
  stock: number;
  category: string;
  document_type: string | null;
  country: string | null;
  image_urls: any;
  preview_link: string | null;
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить товары",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно",
        description: "Товар удален",
      });
      loadProducts();
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  }

  async function handleDeleteTestTemplates() {
    if (!confirm('Вы уверены, что хотите удалить все тестовые товары из категории "Digital Template"?')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("category", "Digital Template");

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Тестовые товары удалены",
      });
      loadProducts();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить тестовые товары",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Управление товарами</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handleDeleteTestTemplates} 
              variant="destructive"
              disabled={deleting}
            >
              {deleting ? "Удаление..." : "Удалить тестовые"}
            </Button>
            <Button onClick={() => setShowCSVImport(true)} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Импорт CSV
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить товар
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProductsTable
            products={products}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleFormClose}
        />
      )}

      {showCSVImport && (
        <CSVImport
          onClose={() => {
            setShowCSVImport(false);
            loadProducts();
          }}
        />
      )}
    </div>
  );
}
