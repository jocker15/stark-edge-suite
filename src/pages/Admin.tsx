import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminUsersNew } from "@/components/admin/users";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminReviews } from "@/components/admin/AdminReviews";
import { Loader2 } from "lucide-react";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      if (authLoading) return;
      
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
  }, [user, authLoading, navigate]);

  if (authLoading || checkingRole) {
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

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" onClick={() => navigate('/admin/dashboard')}>Панель</TabsTrigger>
            <TabsTrigger value="products">Товары</TabsTrigger>
            <TabsTrigger value="reviews">Отзывы</TabsTrigger>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <AdminProducts />
          </TabsContent>

          <TabsContent value="reviews">
            <AdminReviews />
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrders />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersNew />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
