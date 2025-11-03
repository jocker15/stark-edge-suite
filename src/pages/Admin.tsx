import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminUsersNew } from "@/components/admin/users";
import { AdminOrdersNew } from "@/components/admin/orders";
import { AdminReviewsNew } from "@/components/admin/reviews";
import { Loader2 } from "lucide-react";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { permissions, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
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

      setIsAdmin(true);
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">Административная панель</CardTitle>
            <CardDescription>
              Управление товарами, пользователями и заказами
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue={permissions.canManageProducts ? "products" : permissions.canModerateReviews ? "reviews" : "dashboard"} className="space-y-6">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${[
            permissions.canAccessDashboard,
            permissions.canManageProducts,
            permissions.canModerateReviews,
            permissions.canManageOrders,
            permissions.canManageUsers,
            permissions.canAccessSecurityCenter
          ].filter(Boolean).length}, minmax(0, 1fr))` }}>
            {permissions.canAccessDashboard && (
              <TabsTrigger value="dashboard" onClick={() => navigate('/admin/dashboard')}>Панель</TabsTrigger>
            )}
            {permissions.canManageProducts && (
              <TabsTrigger value="products">Товары</TabsTrigger>
            )}
            {permissions.canModerateReviews && (
              <TabsTrigger value="reviews">Отзывы</TabsTrigger>
            )}
            {permissions.canManageOrders && (
              <TabsTrigger value="orders">Заказы</TabsTrigger>
            )}
            {permissions.canManageUsers && (
              <TabsTrigger value="users">Пользователи</TabsTrigger>
            )}
            {permissions.canAccessSecurityCenter && (
              <TabsTrigger value="security" onClick={() => navigate('/admin/security')}>Безопасность</TabsTrigger>
            )}
          </TabsList>

          {permissions.canManageProducts && (
            <TabsContent value="products">
              <AdminProducts />
            </TabsContent>
          )}

          {permissions.canModerateReviews && (
            <TabsContent value="reviews">
              <AdminReviewsNew />
            </TabsContent>
          )}

          {permissions.canManageOrders && (
            <TabsContent value="orders">
              <AdminOrdersNew />
            </TabsContent>
          )}

          {permissions.canManageUsers && (
            <TabsContent value="users">
              <AdminUsersNew />
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
