import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Download } from "lucide-react";
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

  async function handleExportProducts() {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      
      if (!products || products.length === 0) {
        toast({
          title: "Предупреждение",
          description: "Нет товаров для экспорта",
        });
        return;
      }

      const headers = ["№", "Country", "type of document", "file name", "Price", "link"];
      
      const escapeCsv = (value: any): string => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = products.map((p, idx) => [
        idx + 1,
        p.country || "",
        p.document_type || "",
        p.name_en || "",
        p.price || 0,
        p.preview_link || ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(escapeCsv).join(","))
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { 
        type: "text/csv;charset=utf-8;" 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Успешно",
        description: `Экспортировано товаров: ${products.length}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать товары",
        variant: "destructive",
      });
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
            <Button onClick={handleExportProducts} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Экспорт CSV
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
