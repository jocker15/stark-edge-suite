import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { getTranslation } from "@/lib/translations/dashboard";
import { format } from "date-fns";

interface OrderData {
  id: number;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

interface RecentOrdersProps {
  data: OrderData[];
  loading: boolean;
  language: 'en' | 'ru';
  onViewDetails?: (orderId: number) => void;
}

export function RecentOrders({ data, loading, language, onViewDetails }: RecentOrdersProps) {
  const t = (key: string) => getTranslation(language, key);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, language === 'ru' ? 'dd.MM.yyyy HH:mm' : 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      pending: { variant: 'secondary', label: t('status.pending') },
      failed: { variant: 'destructive', label: t('status.failed') },
      completed: { variant: 'default', label: t('status.completed') },
    };

    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recentOrders.title')}</CardTitle>
        <CardDescription>{t('recentOrders.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            {t('recentOrders.noOrders')}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('recentOrders.orderId')}</TableHead>
                  <TableHead>{t('recentOrders.user')}</TableHead>
                  <TableHead className="text-right">{t('recentOrders.amount')}</TableHead>
                  <TableHead>{t('recentOrders.status')}</TableHead>
                  <TableHead>{t('recentOrders.date')}</TableHead>
                  <TableHead className="text-right">{t('recentOrders.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {order.user_name || order.user_email || '—'}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {order.user_id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails?.(order.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('recentOrders.viewDetails')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
