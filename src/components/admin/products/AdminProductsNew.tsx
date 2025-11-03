import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Download } from "lucide-react";
import { ProductsDataTable } from "./ProductsDataTable";
import { ProductFormDialog } from "./ProductFormDialog";
import { CSVImporter } from "../csv-import";
import { Tables } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductManagerTranslation } from "@/lib/translations/product-manager";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Papa from "papaparse";

type Product = Tables<"products">;

export function AdminProductsNew() {
  const { lang } = useLanguage();
  const t = (key: string) => getProductManagerTranslation(lang, key);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [bulkActionConfirm, setBulkActionConfirm] = useState<{ open: boolean; action: string; ids: number[] }>({ open: false, action: "", ids: [] });
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: t("errors.loadProducts"),
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    setDeleteConfirm({ open: true, id });
  }

  async function confirmDelete() {
    if (!deleteConfirm.id) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteConfirm.id);

    if (error) {
      toast({
        title: t("errors.deleteProduct"),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("toasts.productDeleted"),
      });
      loadProducts();
    }
    setDeleteConfirm({ open: false, id: null });
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingProduct(null);
  }

  function handleFormSuccess() {
    loadProducts();
  }

  async function handleBulkAction(action: string, ids: number[]) {
    setBulkActionConfirm({ open: true, action, ids });
  }

  async function confirmBulkAction() {
    const { action, ids } = bulkActionConfirm;

    try {
      if (action === "delete") {
        const { error } = await supabase
          .from("products")
          .delete()
          .in("id", ids);

        if (error) throw error;

        toast({
          title: t("toasts.productsDeleted").replace("{count}", ids.length.toString()),
        });
      } else if (action === "publish") {
        const { error } = await supabase
          .from("products")
          .update({ status: "active" })
          .in("id", ids);

        if (error) throw error;

        toast({
          title: t("toasts.statusUpdated").replace("{count}", ids.length.toString()),
        });
      } else if (action === "unpublish") {
        const { error } = await supabase
          .from("products")
          .update({ status: "draft" })
          .in("id", ids);

        if (error) throw error;

        toast({
          title: t("toasts.statusUpdated").replace("{count}", ids.length.toString()),
        });
      } else if (action === "archive") {
        const { error } = await supabase
          .from("products")
          .update({ status: "archived" })
          .in("id", ids);

        if (error) throw error;

        toast({
          title: t("toasts.statusUpdated").replace("{count}", ids.length.toString()),
        });
      } else if (action === "export") {
        await handleExportProducts(ids);
      }

      loadProducts();
    } catch (error) {
      console.error("Bulk action error:", error);
      toast({
        title: t("toasts.error"),
        variant: "destructive",
      });
    } finally {
      setBulkActionConfirm({ open: false, action: "", ids: [] });
    }
  }

  async function handleExportProducts(ids?: number[]) {
    try {
      let query = supabase.from("products").select("*").order("id", { ascending: true });
      
      if (ids && ids.length > 0) {
        query = query.in("id", ids);
      }

      const { data: productsData, error } = await query;

      if (error) throw error;

      if (!productsData || productsData.length === 0) {
        toast({
          title: t("empty.noProducts"),
        });
        return;
      }

      const csvData = productsData.map((p) => ({
        id: p.id,
        sku: p.sku || "",
        name_en: p.name_en || "",
        name_ru: p.name_ru || "",
        description_en: p.description_en || "",
        description_ru: p.description_ru || "",
        slug: p.slug || "",
        price: p.price,
        old_price: p.old_price || "",
        currency: p.currency || "USD",
        category: p.category || "",
        status: p.status || "draft",
        stock: p.stock,
        country: p.country || "",
        state: p.state || "",
        document_type: p.document_type || "",
        is_digital: p.is_digital,
        download_limit: p.download_limit || "",
        meta_title: p.meta_title || "",
        meta_description: p.meta_description || "",
      }));

      const csv = Papa.unparse(csvData);
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t("toasts.exportSuccess").replace("{count}", productsData.length.toString()),
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: t("errors.loadProducts"),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>{t("title")}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addProduct")}
              </Button>
              <Button onClick={() => setShowCSVImport(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                {t("importCSV")}
              </Button>
              <Button onClick={() => handleExportProducts()} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t("exportCSV")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProductsDataTable
            products={products}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkAction={handleBulkAction}
          />
        </CardContent>
      </Card>

      <ProductFormDialog
        product={editingProduct}
        open={showForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {showCSVImport && (
        <CSVImporter
          onClose={() => {
            setShowCSVImport(false);
            loadProducts();
          }}
        />
      )}

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmations.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmations.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirmations.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t("confirmations.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkActionConfirm.open} onOpenChange={(open) => setBulkActionConfirm({ ...bulkActionConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkActionConfirm.action === "delete" 
                ? t("confirmations.bulkDelete.title")
                : t("confirmations.bulkStatusChange.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkActionConfirm.action === "delete"
                ? t("confirmations.bulkDelete.description").replace("{count}", bulkActionConfirm.ids.length.toString())
                : t("confirmations.bulkStatusChange.description")
                    .replace("{count}", bulkActionConfirm.ids.length.toString())
                    .replace("{status}", t(`status.${bulkActionConfirm.action === "publish" ? "active" : bulkActionConfirm.action === "unpublish" ? "draft" : "archived"}`))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("confirmations.bulkDelete.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkAction}>
              {t("confirmations.bulkDelete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
