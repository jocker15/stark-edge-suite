import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LoadingCard } from "@/components/ui/loading-spinner";
import { Loader2 } from "lucide-react";

const AdminProducts = lazy(() => import("@/components/admin/AdminProducts").then(m => ({ default: m.AdminProducts })));
const AdminUsersNew = lazy(() => import("@/components/admin/users").then(m => ({ default: m.AdminUsersNew })));
const AdminOrdersNew = lazy(() => import("@/components/admin/orders").then(m => ({ default: m.AdminOrdersNew })));
const AdminReviewsNew = lazy(() => import("@/components/admin/reviews").then(m => ({ default: m.AdminReviewsNew })));

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { permissions, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  
  // Get tab from navigation state
  const locationState = location.state as { tab?: string; filter?: string; orderId?: number } | null;
  const initialTab = locationState?.tab || (permissions.canManageProducts ? "products" : permissions.canModerateReviews ? "reviews" : "dashboard");
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Update active tab when location state changes
  useEffect(() => {
    if (locationState?.tab) {
      setActiveTab(locationState.tab);
    }
  }, [locationState?.tab]);

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${[
            permissions.canAccessDashboard,
            permissions.canManageProducts,
            permissions.canModerateReviews,
            permissions.canManageOrders,
            permissions.canManageUsers,
            permissions.canAccessSecurityCenter,
            permissions.canManageSettings
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
            {permissions.canManageSettings && (
              <TabsTrigger value="settings" onClick={() => navigate('/admin/settings')}>Настройки</TabsTrigger>
            )}
          </TabsList>

          {permissions.canManageProducts && (
            <TabsContent value="products">
              <Suspense fallback={<LoadingCard />}>
                <AdminProducts />
              </Suspense>
            </TabsContent>
          )}

          {permissions.canModerateReviews && (
            <TabsContent value="reviews">
              <Suspense fallback={<LoadingCard />}>
                <AdminReviewsNew />
              </Suspense>
            </TabsContent>
          )}

          {permissions.canManageOrders && (
            <TabsContent value="orders">
              <Suspense fallback={<LoadingCard />}>
                <AdminOrdersNew />
              </Suspense>
            </TabsContent>
          )}

          {permissions.canManageUsers && (
            <TabsContent value="users">
              <Suspense fallback={<LoadingCard />}>
                <AdminUsersNew />
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
