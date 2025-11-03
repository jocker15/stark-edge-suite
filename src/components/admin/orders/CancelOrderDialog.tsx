import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { orderManagerTranslations } from "@/lib/translations/order-manager";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  lang: "en" | "ru";
  onSuccess?: () => void;
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  orderId,
  lang,
  onSuccess,
}: CancelOrderDialogProps) {
  const t = orderManagerTranslations[lang].dialogs.cancelOrder;
  const [loading, setLoading] = useState(false);
  const [restock, setRestock] = useState(false);
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        entity_type: "order",
        entity_id: orderId.toString(),
        action_type: "cancel",
        details: {
          restock,
          reason: reason || null,
        },
      });

      toast({
        title: lang === "ru" ? "Успешно" : "Success",
        description: t.success,
      });

      onSuccess?.();
      onOpenChange(false);
      setReason("");
      setRestock(false);
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: lang === "ru" ? "Ошибка" : "Error",
        description: t.error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="restock"
              checked={restock}
              onCheckedChange={(checked) => setRestock(checked as boolean)}
            />
            <Label htmlFor="restock" className="cursor-pointer">
              {t.restockLabel}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">{t.reasonLabel}</Label>
            <Textarea
              id="reason"
              placeholder={t.reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
