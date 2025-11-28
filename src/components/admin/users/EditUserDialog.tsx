import { useState, useEffect, useCallback } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { UserStats } from "./UsersDataTable";

interface EditUserDialogProps {
  user: UserStats;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserDialog({ user, open, onClose, onSuccess }: EditUserDialogProps) {
  const { lang } = useLanguage();
  const t = useCallback((key: string) => getUserManagerTranslation(lang, key), [lang]);
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    phone: user.phone || "",
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      
      const roles = user.role ? user.role.split(",").map(r => r.trim()) : [];
      setSelectedRoles(roles);
      
      loadUserRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  async function loadUserRoles() {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.user_id);
    
    if (data) {
      setSelectedRoles(data.map(r => r.role));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
        })
        .eq("user_id", user.user_id);

      if (profileError) throw profileError;

      const existingRoles = user.role ? user.role.split(",").map(r => r.trim()) : [];
      const rolesToAdd = selectedRoles.filter(r => !existingRoles.includes(r));
      const rolesToRemove = existingRoles.filter(r => !selectedRoles.includes(r));

      for (const role of rolesToRemove) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.user_id)
          .eq("role", role as "admin" | "moderator" | "user");
      }

      for (const role of rolesToAdd) {
        await supabase
          .from("user_roles")
          .insert([{ user_id: user.user_id, role: role as "admin" | "moderator" | "user" }]);
      }

      await supabase.from("audit_logs").insert({
        entity_type: "user",
        entity_id: user.user_id,
        action_type: "update",
        details: {
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          roles: selectedRoles,
        },
      });

      toast({
        title: t("edit.success"),
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: t("edit.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("edit.title")}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("edit.username")}</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("edit.email")}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("edit.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("edit.role")}</Label>
            <div className="flex gap-2 flex-wrap">
              {["admin", "moderator", "user"].map((role) => (
                <Button
                  key={role}
                  type="button"
                  size="sm"
                  variant={selectedRoles.includes(role) ? "default" : "outline"}
                  onClick={() => toggleRole(role)}
                >
                  {t(`roles.${role}`)}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("edit.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
