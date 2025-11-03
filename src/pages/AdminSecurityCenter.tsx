import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { securityCenterTranslations } from "@/lib/translations/security-center";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LoginActivityTable, AuditLogsTable, RoleManagement } from "@/components/admin/security";
import { Loader2, Shield } from "lucide-react";

export default function AdminSecurityCenter() {
  const { user, loading: authLoading } = useAuth();
  const { permissions, isSuperAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = securityCenterTranslations[language];
  
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      if (authLoading || rolesLoading) return;
      
      if (!user) {
        navigate("/signin");
        return;
      }

      const { data: hasAdminRole } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (!hasAdminRole) {
        navigate("/");
        return;
      }

      setHasAccess(true);
      setCheckingRole(false);
    }

    checkAdminRole();
  }, [user, authLoading, rolesLoading, navigate]);

  if (authLoading || checkingRole || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Shield className="h-8 w-8" />
              {t.title}
            </CardTitle>
            <CardDescription>
              {t.description}
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="login-activity" className="space-y-6">
          <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {permissions.canViewLoginEvents && (
              <TabsTrigger value="login-activity">{t.tabs.loginActivity}</TabsTrigger>
            )}
            {permissions.canViewAuditLogs && (
              <TabsTrigger value="audit-logs">{t.tabs.auditLogs}</TabsTrigger>
            )}
            {permissions.canManageRoles && (
              <TabsTrigger value="role-management">{t.tabs.roleManagement}</TabsTrigger>
            )}
          </TabsList>

          {permissions.canViewLoginEvents && (
            <TabsContent value="login-activity">
              <LoginActivityTable />
            </TabsContent>
          )}

          {permissions.canViewAuditLogs && (
            <TabsContent value="audit-logs">
              <AuditLogsTable />
            </TabsContent>
          )}

          {permissions.canManageRoles && (
            <TabsContent value="role-management">
              <RoleManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
