import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUserManagerTranslation } from "@/lib/translations/user-manager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { UserStats } from "./UsersDataTable";

interface DeleteUserDialogProps {
  user: UserStats;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteUserDialog({ user, open, onClose, onSuccess }: DeleteUserDialogProps) {
  const { lang } = useLanguage();
  const t = useCallback((key: string) => getUserManagerTranslation(lang, key), [lang]);
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function handleDelete() {
    if (confirmText !== "DELETE") {
      toast({
        title: "Error",
        description: t("delete.confirmText"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", user.user_id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        entity_type: "user",
        entity_id: user.user_id,
        action_type: "delete",
        details: {
          username: user.username,
          email: user.email,
          order_count: user.order_count,
        },
      });

      toast({
        title: t("delete.success"),
      });

      onSuccess();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: t("delete.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("delete.title")}
          </DialogTitle>
          <DialogDescription>{t("delete.message")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {user.order_count > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t("delete.warning").replace("{count}", user.order_count.toString())}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>{t("delete.confirmText")}</Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("delete.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmText !== "DELETE"}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("delete.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
