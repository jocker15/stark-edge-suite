import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoriesManagerTranslation } from "@/lib/translations/categories-manager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { Category } from "./AdminCategoriesNew";

interface DeleteCategoryDialogProps {
  category: Category | null;
  categories: Category[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DeleteCheckResult {
  can_delete: boolean;
  product_count: number;
  child_count: number;
}

export function DeleteCategoryDialog({
  category,
  categories,
  open,
  onClose,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getCategoriesManagerTranslation(lang, key);
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteCheck, setDeleteCheck] = useState<DeleteCheckResult | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState<string>("");

  useEffect(() => {
    if (category && open) {
      checkCanDelete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, open]);

  const checkCanDelete = async () => {
    if (!category) return;

    try {
      setChecking(true);
      const { data, error } = await supabase.rpc("can_delete_category", {
        category_id_param: category.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setDeleteCheck(data[0]);
      }
    } catch (error) {
      console.error("Error checking category:", error);
      toast({
        title: t("messages.error"),
        description: error instanceof Error ? error.message : "Failed to check category",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;

    try {
      setDeleting(true);

      if (deleteCheck && deleteCheck.product_count > 0 && reassignCategoryId) {
        const { error: reassignError } = await supabase.rpc("reassign_products_category", {
          from_category_id: category.id,
          to_category_id: reassignCategoryId,
        });

        if (reassignError) throw reassignError;

        toast({
          title: t("messages.reassignSuccess").replace(
            "{count}",
            String(deleteCheck.product_count)
          ),
        });
      }

      const { error: deleteError } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", category.id);

      if (deleteError) throw deleteError;

      toast({
        title: t("messages.deleteSuccess"),
      });

      onSuccess();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: t("messages.error"),
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const canProceed = () => {
    if (!deleteCheck) return false;
    
    if (deleteCheck.child_count > 0) return false;
    
    if (deleteCheck.product_count > 0 && !reassignCategoryId) return false;

    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("delete.title")}</DialogTitle>
          <DialogDescription>
            {category && (
              <span className="font-medium">
                {lang === "ru" ? category.name_ru : category.name_en}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {deleteCheck && deleteCheck.child_count > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t("delete.withChildren").replace(
                    "{count}",
                    String(deleteCheck.child_count)
                  )}
                </AlertDescription>
              </Alert>
            )}

            {deleteCheck && deleteCheck.product_count > 0 && (
              <div className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {t("delete.reassignMessage").replace(
                      "{count}",
                      String(deleteCheck.product_count)
                    )}
                  </AlertDescription>
                </Alert>

                <Select
                  value={reassignCategoryId}
                  onValueChange={setReassignCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("delete.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {lang === "ru" ? cat.name_ru : cat.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {deleteCheck && deleteCheck.can_delete && (
              <p className="text-sm text-muted-foreground">
                {t("delete.message")}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            {t("cancelButton")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canProceed() || deleting}
          >
            {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {deleteCheck && deleteCheck.product_count > 0
              ? t("delete.reassignAndDelete")
              : t("confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
