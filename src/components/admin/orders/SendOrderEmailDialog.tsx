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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { orderManagerTranslations } from "@/lib/translations/order-manager";
import { Loader2 } from "lucide-react";

interface SendOrderEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  customerEmail: string | null;
  lang: "en" | "ru";
  onSuccess?: () => void;
}

export function SendOrderEmailDialog({
  open,
  onOpenChange,
  orderId,
  customerEmail,
  lang,
  onSuccess,
}: SendOrderEmailDialogProps) {
  const t = orderManagerTranslations[lang].dialogs.sendEmail;
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState("none");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    
    if (value === "orderUpdate") {
      setSubject(lang === "ru" ? "Обновление заказа" : "Order Update");
      setMessage(lang === "ru" 
        ? `Здравствуйте!\n\nВаш заказ #${orderId} был обновлен.\n\nС уважением,\nКоманда поддержки`
        : `Hello!\n\nYour order #${orderId} has been updated.\n\nBest regards,\nSupport Team`
      );
    } else if (value === "deliveryUpdate") {
      setSubject(lang === "ru" ? "Обновление доставки" : "Delivery Update");
      setMessage(lang === "ru"
        ? `Здравствуйте!\n\nОбновлен статус доставки вашего заказа #${orderId}.\n\nС уважением,\nКоманда поддержки`
        : `Hello!\n\nThe delivery status of your order #${orderId} has been updated.\n\nBest regards,\nSupport Team`
      );
    } else if (value === "supportResponse") {
      setSubject(lang === "ru" ? "Ответ от поддержки" : "Support Response");
      setMessage(lang === "ru"
        ? `Здравствуйте!\n\nПо вашему заказу #${orderId}:\n\n[Введите ваш ответ]\n\nС уважением,\nКоманда поддержки`
        : `Hello!\n\nRegarding your order #${orderId}:\n\n[Enter your response]\n\nBest regards,\nSupport Team`
      );
    }
  };

  const handleSend = async () => {
    if (!customerEmail) {
      toast({
        title: lang === "ru" ? "Ошибка" : "Error",
        description: t.noEmail,
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        title: lang === "ru" ? "Ошибка" : "Error",
        description: lang === "ru" ? "Заполните все поля" : "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: customerEmail,
          subject,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast({
        title: lang === "ru" ? "Успешно" : "Success",
        description: t.success,
      });

      onSuccess?.();
      onOpenChange(false);
      setTemplate("none");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error sending email:", error);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {customerEmail ? (
            <div>
              <p className="text-sm text-muted-foreground">
                {lang === "ru" ? "Получатель:" : "Recipient:"}
              </p>
              <p className="font-medium">{customerEmail}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-destructive">{t.noEmail}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="template">{t.templateLabel}</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t.templates.none}</SelectItem>
                <SelectItem value="orderUpdate">{t.templates.orderUpdate}</SelectItem>
                <SelectItem value="deliveryUpdate">{t.templates.deliveryUpdate}</SelectItem>
                <SelectItem value="supportResponse">{t.templates.supportResponse}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{t.subjectLabel}</Label>
            <Input
              id="subject"
              placeholder={t.subjectPlaceholder}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t.messageLabel}</Label>
            <Textarea
              id="message"
              placeholder={t.messagePlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
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
            onClick={handleSend}
            disabled={loading || !customerEmail || !subject.trim() || !message.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
