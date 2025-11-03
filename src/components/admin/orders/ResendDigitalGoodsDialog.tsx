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
import { useToast } from "@/hooks/use-toast";
import { orderManagerTranslations } from "@/lib/translations/order-manager";
import { Loader2 } from "lucide-react";

interface ResendDigitalGoodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  customerEmail: string | null;
  lang: "en" | "ru";
  onSuccess?: () => void;
}

export function ResendDigitalGoodsDialog({
  open,
  onOpenChange,
  orderId,
  customerEmail,
  lang,
  onSuccess,
}: ResendDigitalGoodsDialogProps) {
  const t = orderManagerTranslations[lang].dialogs.resend;
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    if (!customerEmail) {
      toast({
        title: lang === "ru" ? "Ошибка" : "Error",
        description: t.noEmail,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/resend-digital-goods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to resend digital goods");
      }

      toast({
        title: lang === "ru" ? "Успешно" : "Success",
        description: t.success,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error resending digital goods:", error);
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

        {customerEmail ? (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {lang === "ru" ? "Email получателя:" : "Recipient email:"}
            </p>
            <p className="font-medium">{customerEmail}</p>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-destructive">{t.noEmail}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleResend}
            disabled={loading || !customerEmail}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
