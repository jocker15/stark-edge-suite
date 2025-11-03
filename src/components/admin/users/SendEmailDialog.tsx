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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { UserStats } from "./UsersDataTable";

interface SendEmailDialogProps {
  users: UserStats[];
  open: boolean;
  onClose: () => void;
}

const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Welcome to Dokument.shop!",
    body: `<h1>Welcome!</h1>
<p>Thank you for joining Dokument.shop. We're excited to have you as a member of our community.</p>
<p>Best regards,<br>The Dokument.shop Team</p>`,
  },
  passwordReset: {
    subject: "Password Reset Request",
    body: `<h1>Password Reset</h1>
<p>You requested a password reset for your account. Please click the link below to reset your password.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br>The Dokument.shop Team</p>`,
  },
  orderUpdate: {
    subject: "Order Update",
    body: `<h1>Order Update</h1>
<p>Your order status has been updated.</p>
<p>Best regards,<br>The Dokument.shop Team</p>`,
  },
};

export function SendEmailDialog({ users, open, onClose }: SendEmailDialogProps) {
  const { lang } = useLanguage();
  const t = useCallback((key: string) => getUserManagerTranslation(lang, key), [lang]);
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<string>("custom");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    if (value !== "custom" && value in EMAIL_TEMPLATES) {
      const tpl = EMAIL_TEMPLATES[value as keyof typeof EMAIL_TEMPLATES];
      setSubject(tpl.subject);
      setMessage(tpl.body);
    } else {
      setSubject("");
      setMessage("");
    }
  };

  async function handleSend() {
    if (!subject || !message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const recipients = users.map(u => u.email).filter(Boolean) as string[];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-user-email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: recipients,
            subject,
            html: message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      const result = await response.json();

      toast({
        title: users.length > 1 ? t("bulkEmail.success") : t("email.success"),
        description: result.message,
      });

      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: users.length > 1 ? t("bulkEmail.error") : t("email.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const isBulk = users.length > 1;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isBulk ? t("bulkEmail.title") : t("email.title")}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? t("bulkEmail.recipients").replace("{count}", users.length.toString())
              : users[0]?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("email.template")}</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">{t("email.templates.custom")}</SelectItem>
                <SelectItem value="welcome">{t("email.templates.welcome")}</SelectItem>
                <SelectItem value="passwordReset">{t("email.templates.passwordReset")}</SelectItem>
                <SelectItem value="orderUpdate">{t("email.templates.orderUpdate")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("email.subject")}</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("email.message")}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Email message (HTML supported)"
              rows={10}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("email.cancel")}
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isBulk ? t("bulkEmail.send") : t("email.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
