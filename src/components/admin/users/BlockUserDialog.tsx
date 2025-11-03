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
import { Loader2 } from "lucide-react";
import { UserStats } from "./UsersDataTable";

interface BlockUserDialogProps {
  user: UserStats;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BlockUserDialog({ user, open, onClose, onSuccess }: BlockUserDialogProps) {
  const { lang } = useLanguage();
  const t = useCallback((key: string) => getUserManagerTranslation(lang, key), [lang]);
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const isBlocking = !user.is_blocked;

  async function handleToggleBlock() {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: isBlocking })
        .eq("user_id", user.user_id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        entity_type: "user",
        entity_id: user.user_id,
        action_type: isBlocking ? "block" : "unblock",
        details: {
          username: user.username,
          email: user.email,
        },
      });

      toast({
        title: isBlocking ? t("block.success") : t("unblock.success"),
      });

      onSuccess();
    } catch (error) {
      console.error("Error toggling block status:", error);
      toast({
        title: isBlocking ? t("block.error") : t("unblock.error"),
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
          <DialogTitle>
            {isBlocking ? t("block.title") : t("unblock.title")}
          </DialogTitle>
          <DialogDescription>
            {isBlocking ? t("block.message") : t("unblock.message")}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isBlocking ? t("block.cancel") : t("unblock.cancel")}
          </Button>
          <Button
            variant={isBlocking ? "destructive" : "default"}
            onClick={handleToggleBlock}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isBlocking ? t("block.confirm") : t("unblock.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
