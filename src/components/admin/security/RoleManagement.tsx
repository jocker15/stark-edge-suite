import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { securityCenterTranslations } from "@/lib/translations/security-center";
import { auditLogger } from "@/lib/auditLogger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ShieldCheck, ShieldAlert, User, Settings, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserWithRoles {
  user_id: string;
  email: string;
  username: string;
  roles: string[];
}

interface RoleInfo {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function RoleManagement() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = securityCenterTranslations[language];
  
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const availableRoles: RoleInfo[] = [
    {
      value: "super_admin",
      label: t.roleManagement.hierarchy.superAdmin,
      description: t.roleManagement.hierarchy.superAdminDesc,
      icon: <ShieldCheck className="h-5 w-5 text-red-500" />
    },
    {
      value: "admin",
      label: t.roleManagement.hierarchy.admin,
      description: t.roleManagement.hierarchy.adminDesc,
      icon: <ShieldAlert className="h-5 w-5 text-blue-500" />
    },
    {
      value: "moderator",
      label: t.roleManagement.hierarchy.moderator,
      description: t.roleManagement.hierarchy.moderatorDesc,
      icon: <Shield className="h-5 w-5 text-green-500" />
    },
    {
      value: "user",
      label: t.roleManagement.hierarchy.user,
      description: t.roleManagement.hierarchy.userDesc,
      icon: <User className="h-5 w-5 text-gray-500" />
    }
  ];

  const fetchUsersWithRoles = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, username")
        .order("email");

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        user_id: profile.user_id,
        email: profile.email || "",
        username: profile.username || "",
        roles: userRoles?.filter(ur => ur.user_id === profile.user_id).map(ur => ur.role) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users with roles:", error);
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManageRoles = (user: UserWithRoles) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles);
    setManageDialogOpen(true);
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveClick = () => {
    if (!selectedUser) return;
    
    const rolesToAdd = selectedRoles.filter(r => !selectedUser.roles.includes(r));
    const rolesToRemove = selectedUser.roles.filter(r => !selectedRoles.includes(r));
    
    if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
      toast({
        title: t.roleManagement.messages.noChanges,
        variant: "default"
      });
      setManageDialogOpen(false);
      return;
    }
    
    setManageDialogOpen(false);
    setConfirmDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      
      const rolesToAdd = selectedRoles.filter(r => !selectedUser.roles.includes(r));
      const rolesToRemove = selectedUser.roles.filter(r => !selectedRoles.includes(r));

      for (const role of rolesToRemove) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", selectedUser.user_id)
          .eq("role", role);

        if (error) throw error;
      }

      for (const role of rolesToAdd) {
        const { error } = await supabase
          .from("user_roles")
          .insert({
            user_id: selectedUser.user_id,
            role: role
          });

        if (error) throw error;
      }

      await auditLogger.user.roleChanged(selectedUser.user_id, {
        added_roles: rolesToAdd,
        removed_roles: rolesToRemove,
        email: selectedUser.email
      });

      toast({
        title: t.roleManagement.messages.success,
        description: `Roles updated for ${selectedUser.email}`
      });

      await fetchUsersWithRoles();
      setConfirmDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating roles:", error);
      toast({
        title: t.roleManagement.messages.error,
        description: error instanceof Error ? error.message : "Failed to update roles",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      super_admin: "destructive",
      admin: "default",
      moderator: "secondary",
      user: "secondary"
    };
    return <Badge variant={variants[role] || "secondary"}>{role}</Badge>;
  };

  const rolesToAdd = selectedUser ? selectedRoles.filter(r => !selectedUser.roles.includes(r)) : [];
  const rolesToRemove = selectedUser ? selectedUser.roles.filter(r => !selectedRoles.includes(r)) : [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t.roleManagement.title}</CardTitle>
          <CardDescription>{t.roleManagement.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {availableRoles.map(role => (
                <Card key={role.value}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {role.icon}
                      {role.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Input
              placeholder={t.roleManagement.search.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.roleManagement.table.user}</TableHead>
                    <TableHead>{t.roleManagement.table.email}</TableHead>
                    <TableHead>{t.roleManagement.table.currentRoles}</TableHead>
                    <TableHead className="text-right">{t.roleManagement.table.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {t.roleManagement.search.noResults}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">{user.username || "-"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {user.roles.length > 0 ? (
                              user.roles.map(role => getRoleBadge(role))
                            ) : (
                              <span className="text-sm text-muted-foreground">{t.roleManagement.table.noRoles}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleManageRoles(user)}
                            variant="outline"
                            size="sm"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            {t.roleManagement.table.manageRoles}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.roleManagement.manageDialog.title}</DialogTitle>
            <DialogDescription>
              {selectedUser && `${selectedUser.email}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{t.roleManagement.manageDialog.warning}</AlertDescription>
            </Alert>

            <div>
              <h4 className="text-sm font-medium mb-3">{t.roleManagement.manageDialog.availableRoles}</h4>
              <div className="space-y-2">
                {availableRoles.map(role => (
                  <div key={role.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={role.value}
                      checked={selectedRoles.includes(role.value)}
                      onCheckedChange={() => handleRoleToggle(role.value)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={role.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                      >
                        {role.icon}
                        {role.label}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setManageDialogOpen(false)} variant="outline">
              {t.roleManagement.manageDialog.cancel}
            </Button>
            <Button onClick={handleSaveClick}>
              {t.roleManagement.manageDialog.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.roleManagement.confirmDialog.title}</DialogTitle>
            <DialogDescription>
              {t.roleManagement.confirmDialog.message} {selectedUser?.email}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {rolesToAdd.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">{t.roleManagement.confirmDialog.adding}:</h4>
                <div className="flex gap-2 flex-wrap">
                  {rolesToAdd.map(role => getRoleBadge(role))}
                </div>
              </div>
            )}
            {rolesToRemove.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">{t.roleManagement.confirmDialog.removing}:</h4>
                <div className="flex gap-2 flex-wrap">
                  {rolesToRemove.map(role => getRoleBadge(role))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setConfirmDialogOpen(false)} variant="outline" disabled={saving}>
              {t.roleManagement.confirmDialog.cancel}
            </Button>
            <Button onClick={handleConfirmSave} disabled={saving}>
              {saving ? t.common.loading : t.roleManagement.confirmDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
