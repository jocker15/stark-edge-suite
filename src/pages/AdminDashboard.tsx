import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import {
  DashboardStats,
  SalesChart,
  TopProductsChart,
  GeographyChart,
  RecentOrders,
} from "@/components/admin/dashboard";
import { getTranslation } from "@/lib/translations/dashboard";

interface DashboardStats {
  sales_today: number;
  sales_week: number;
  sales_month: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
  active_products: number;
  pending_reviews: number;
  pending_orders: number;
  failed_orders: number;
  total_revenue: number;
  total_orders: number;
  total_users: number;
}

interface SalesData {
  date: string;
  sales_count: number;
  revenue: number;
}

interface TopProductData {
  product_id: number;
  product_name: string;
  sales_count: number;
  revenue: number;
}

interface GeographyData {
  country: string;
  state: string;
  order_count: number;
  revenue: number;
}

interface OrderData {
  id: number;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

interface DashboardData {
  stats: DashboardStats | null;
  salesByDay: SalesData[];
  topProducts: TopProductData[];
  geography: GeographyData[];
  recentOrders: OrderData[];
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState(30);
  
  const [data, setData] = useState<DashboardData>({
    stats: null,
    salesByDay: [],
    topProducts: [],
    geography: [],
    recentOrders: [],
  });

  const t = (key: string) => getTranslation(language, key);

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

  const loadDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [statsRes, salesRes, productsRes, geographyRes, ordersRes] = await Promise.all([
        supabase.rpc('get_dashboard_stats'),
        supabase.rpc('get_sales_by_day', { days_count: salesPeriod }),
        supabase.rpc('get_top_products', { limit_count: 5, days_count: 30 }),
        supabase.rpc('get_orders_by_geography', { days_count: 30 }),
        supabase.rpc('get_orders_requiring_attention', { limit_count: 10 }),
      ]);

      if (statsRes.error) throw statsRes.error;
      if (salesRes.error) throw salesRes.error;
      if (productsRes.error) throw productsRes.error;
      if (geographyRes.error) throw geographyRes.error;
      if (ordersRes.error) throw ordersRes.error;

      setData({
        stats: statsRes.data,
        salesByDay: salesRes.data || [],
        topProducts: productsRes.data || [],
        geography: geographyRes.data || [],
        recentOrders: ordersRes.data || [],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: t('errors.loadStats'),
        description: t('errors.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [salesPeriod, toast, t]);

  useEffect(() => {
    if (isAdmin && !checkingRole) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, checkingRole]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && isAdmin) {
      interval = setInterval(() => {
        loadDashboardData(false);
      }, 30000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, isAdmin, loadDashboardData]);

  const handleManualRefresh = () => {
    loadDashboardData(false);
  };

  const handleSalesPeriodChange = (days: number) => {
    setSalesPeriod(days);
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesPeriod]);

  const handleViewOrderDetails = (orderId: number) => {
    navigate('/admin', { state: { tab: 'orders', orderId } });
  };

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label htmlFor="auto-refresh" className="cursor-pointer text-sm">
                    {t('refresh.auto')}
                    <span className="text-xs text-muted-foreground ml-1">
                      {t('refresh.interval')}
                    </span>
                  </Label>
                </div>
                <Button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {t('refresh.manual')}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value="dashboard" className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">{language === 'ru' ? 'Панель' : 'Dashboard'}</TabsTrigger>
            <TabsTrigger value="products" onClick={() => navigate('/admin')}>{language === 'ru' ? 'Товары' : 'Products'}</TabsTrigger>
            <TabsTrigger value="reviews" onClick={() => navigate('/admin')}>{language === 'ru' ? 'Отзывы' : 'Reviews'}</TabsTrigger>
            <TabsTrigger value="orders" onClick={() => navigate('/admin')}>{language === 'ru' ? 'Заказы' : 'Orders'}</TabsTrigger>
            <TabsTrigger value="users" onClick={() => navigate('/admin')}>{language === 'ru' ? 'Пользователи' : 'Users'}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-6">
          <DashboardStats
            stats={data.stats}
            loading={loading}
            language={language}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <SalesChart
              data={data.salesByDay}
              loading={loading}
              language={language}
              onPeriodChange={handleSalesPeriodChange}
            />
            
            <TopProductsChart
              data={data.topProducts}
              loading={loading}
              language={language}
            />
          </div>

          <GeographyChart
            data={data.geography}
            loading={loading}
            language={language}
          />

          <RecentOrders
            data={data.recentOrders}
            loading={loading}
            language={language}
            onViewDetails={handleViewOrderDetails}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
