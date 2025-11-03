import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUserManagerTranslation } from "@/lib/translations/user-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersDataTable, UserStats } from "./UsersDataTable";
import { UserProfileDrawer } from "./UserProfileDrawer";
import { SendEmailDialog } from "./SendEmailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AdminUsersNew() {
  const { lang } = useLanguage();
  const t = useCallback((key: string) => getUserManagerTranslation(lang, key), [lang]);
  const { toast } = useToast();

  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [bulkActionUsers, setBulkActionUsers] = useState<UserStats[]>([]);
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState<{
    open: boolean;
    action: string;
    userIds: string[];
  }>({ open: false, action: "", userIds: [] });

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data: userStatsData, error } = await supabase
        .from("user_stats")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userStatsWithRoles = await Promise.all(
        (userStatsData || []).map(async (user) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.user_id);

          return {
            ...user,
            role: roles?.map(r => r.role).join(",") || "",
          };
        })
      );

      setUsers(userStatsWithRoles);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleViewProfile(user: UserStats) {
    setSelectedUser(user);
    setProfileDrawerOpen(true);
  }

  async function handleBulkAction(action: string, userIds: string[]) {
    if (action === "export") {
      handleExportCSV(userIds);
      return;
    }

    if (action === "email") {
      const selectedUsers = users.filter(u => userIds.includes(u.user_id));
      setBulkActionUsers(selectedUsers);
      setEmailDialogOpen(true);
      return;
    }

    setBulkConfirmDialog({
      open: true,
      action,
      userIds,
    });
  }

  async function executeBulkAction() {
    const { action, userIds } = bulkConfirmDialog;
    setBulkConfirmDialog({ open: false, action: "", userIds: [] });

    try {
      if (action === "block" || action === "unblock") {
        const isBlocking = action === "block";
        
        for (const userId of userIds) {
          await supabase
            .from("profiles")
            .update({ is_blocked: isBlocking })
            .eq("user_id", userId);
        }

        await supabase.from("audit_logs").insert({
          entity_type: "user",
          action_type: `bulk_${action}`,
          details: {
            user_ids: userIds,
            count: userIds.length,
          },
        });

        toast({
          title: "Success",
          description: `${userIds.length} user(s) ${isBlocking ? "blocked" : "unblocked"}`,
        });

        loadUsers();
      }
    } catch (error) {
      console.error("Error executing bulk action:", error);
      toast({
        title: "Error",
        description: "Failed to execute bulk action",
        variant: "destructive",
      });
    }
  }

  function handleExportCSV(userIds: string[]) {
    const selectedUsers = userIds.length > 0
      ? users.filter(u => userIds.includes(u.user_id))
      : users;

    const headers = [
      "ID",
      "User ID",
      "Email",
      "Username",
      "Phone",
      "Role",
      "Status",
      "Registered",
      "Last Login",
      "Order Count",
      "Total Spent",
    ];

    const rows = selectedUsers.map(user => [
      user.profile_id,
      user.user_id,
      user.email || "",
      user.username || "",
      user.phone || "",
      user.role || "user",
      user.is_blocked ? "Blocked" : "Active",
      new Date(user.created_at).toISOString(),
      user.last_login ? new Date(user.last_login).toISOString() : "",
      user.order_count,
      user.total_spent,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${t("export.filename")}_${new Date().toISOString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t("export.success"),
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersDataTable
            users={users}
            loading={loading}
            onViewProfile={handleViewProfile}
            onBulkAction={handleBulkAction}
          />
        </CardContent>
      </Card>

      <UserProfileDrawer
        user={selectedUser}
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        onUserUpdated={loadUsers}
      />

      <SendEmailDialog
        users={bulkActionUsers}
        open={emailDialogOpen}
        onClose={() => {
          setEmailDialogOpen(false);
          setBulkActionUsers([]);
        }}
      />

      <AlertDialog
        open={bulkConfirmDialog.open}
        onOpenChange={(open) => !open && setBulkConfirmDialog({ open: false, action: "", userIds: [] })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkConfirmDialog.action === "block" ? t("block.title") : t("unblock.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkConfirmDialog.action === "block"
                ? `Are you sure you want to block ${bulkConfirmDialog.userIds.length} user(s)?`
                : `Are you sure you want to unblock ${bulkConfirmDialog.userIds.length} user(s)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
