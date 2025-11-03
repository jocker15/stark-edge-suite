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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { orderManagerTranslations } from "@/lib/translations/order-manager";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RefundOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderAmount: number;
  lang: "en" | "ru";
  onSuccess?: () => void;
}

export function RefundOrderDialog({
  open,
  onOpenChange,
  orderId,
  orderAmount,
  lang,
  onSuccess,
}: RefundOrderDialogProps) {
  const t = orderManagerTranslations[lang].dialogs.refund;
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(orderAmount.toString());
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleRefund = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        entity_type: "order",
        entity_id: orderId.toString(),
        action_type: "refund",
        details: {
          amount: parseFloat(amount),
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
      setAmount(orderAmount.toString());
    } catch (error) {
      console.error("Error refunding order:", error);
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
          <div className="space-y-2">
            <Label htmlFor="amount">{t.amountLabel}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={orderAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
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
            onClick={handleRefund}
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
