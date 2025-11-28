import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Star,
  AlertCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTranslation } from "@/lib/translations/dashboard";

interface DashboardStatsProps {
  stats: {
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
    unread_reviews: number;
    pending_orders: number;
    failed_orders: number;
    total_revenue: number;
    total_orders: number;
    total_users: number;
  } | null;
  loading: boolean;
  language: 'en' | 'ru';
  onNavigate?: (target: 'orders' | 'reviews' | 'products' | 'users', filter?: string) => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  onClick?: () => void;
}

function StatCard({ title, value, icon, trend, variant = 'default', loading, onClick }: StatCardProps) {
  const variants = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(onClick && "cursor-pointer hover:bg-accent/50 transition-colors")}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("rounded-full p-2", variants[variant])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn(
            "text-xs flex items-center gap-1 mt-1",
            trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats({ stats, loading, language, onNavigate }: DashboardStatsProps) {
  const t = (key: string) => getTranslation(language, key);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t('stats.salesToday')}
        value={stats?.sales_today ?? 0}
        icon={<ShoppingCart className="h-4 w-4" />}
        loading={loading}
        variant="default"
        onClick={() => onNavigate?.('orders')}
      />
      
      <StatCard
        title={t('stats.revenueToday')}
        value={formatCurrency(stats?.revenue_today ?? 0)}
        icon={<DollarSign className="h-4 w-4" />}
        loading={loading}
        variant="success"
        onClick={() => onNavigate?.('orders')}
      />
      
      <StatCard
        title={t('stats.salesWeek')}
        value={stats?.sales_week ?? 0}
        icon={<ShoppingCart className="h-4 w-4" />}
        loading={loading}
        variant="default"
        onClick={() => onNavigate?.('orders')}
      />
      
      <StatCard
        title={t('stats.revenueWeek')}
        value={formatCurrency(stats?.revenue_week ?? 0)}
        icon={<DollarSign className="h-4 w-4" />}
        loading={loading}
        variant="success"
        onClick={() => onNavigate?.('orders')}
      />
      
      <StatCard
        title={t('stats.salesMonth')}
        value={stats?.sales_month ?? 0}
        icon={<ShoppingCart className="h-4 w-4" />}
        loading={loading}
        variant="default"
        onClick={() => onNavigate?.('orders')}
      />
      
      <StatCard
        title={t('stats.revenueMonth')}
        value={formatCurrency(stats?.revenue_month ?? 0)}
        icon={<DollarSign className="h-4 w-4" />}
        loading={loading}
        variant="success"
        onClick={() => onNavigate?.('orders')}
      />
      
      <StatCard
        title={t('stats.newUsersToday')}
        value={stats?.new_users_today ?? 0}
        icon={<Users className="h-4 w-4" />}
        loading={loading}
        variant="default"
        onClick={() => onNavigate?.('users')}
      />
      
      <StatCard
        title={t('stats.newUsersWeek')}
        value={stats?.new_users_week ?? 0}
        icon={<Users className="h-4 w-4" />}
        loading={loading}
        variant="default"
        onClick={() => onNavigate?.('users')}
      />
      
      <StatCard
        title={t('stats.activeProducts')}
        value={stats?.active_products ?? 0}
        icon={<Package className="h-4 w-4" />}
        loading={loading}
        variant="default"
        onClick={() => onNavigate?.('products')}
      />
      
      <StatCard
        title={t('stats.pendingReviews')}
        value={stats?.pending_reviews ?? 0}
        icon={<Star className="h-4 w-4" />}
        loading={loading}
        variant="warning"
        onClick={() => onNavigate?.('reviews', 'pending')}
      />
      
      <StatCard
        title={t('stats.unreadReviews')}
        value={stats?.unread_reviews ?? 0}
        icon={<Star className="h-4 w-4" />}
        loading={loading}
        variant="warning"
        onClick={() => onNavigate?.('reviews', 'unread')}
      />
      
      <StatCard
        title={t('stats.pendingOrders')}
        value={stats?.pending_orders ?? 0}
        icon={<AlertCircle className="h-4 w-4" />}
        loading={loading}
        variant="warning"
        onClick={() => onNavigate?.('orders', 'pending')}
      />
      
      <StatCard
        title={t('stats.failedOrders')}
        value={stats?.failed_orders ?? 0}
        icon={<XCircle className="h-4 w-4" />}
        loading={loading}
        variant="danger"
        onClick={() => onNavigate?.('orders', 'failed')}
      />
    </div>
  );
}
