import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTranslation } from "@/lib/translations/dashboard";
import { Badge } from "@/components/ui/badge";

interface GeographyData {
  country: string;
  state: string;
  order_count: number;
  revenue: number;
}

interface GeographyChartProps {
  data: GeographyData[];
  loading: boolean;
  language: 'en' | 'ru';
}

export function GeographyChart({ data, loading, language }: GeographyChartProps) {
  const t = (key: string) => getTranslation(language, key);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalOrders = data.reduce((sum, item) => sum + item.order_count, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  const getIntensityColor = (percentage: number) => {
    if (percentage >= 30) return 'bg-green-500/20 text-green-700 dark:text-green-400';
    if (percentage >= 15) return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    if (percentage >= 5) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('charts.geography')}</CardTitle>
        <CardDescription>{t('charts.geographyDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t('charts.noData')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t('charts.orderCount')}</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('charts.revenue')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
            
            <div className="rounded-md border max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('charts.country')}</TableHead>
                    <TableHead>{t('charts.state')}</TableHead>
                    <TableHead className="text-right">{t('charts.orderCount')}</TableHead>
                    <TableHead className="text-right">{t('charts.revenue')}</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => {
                    const percentage = parseFloat(getPercentage(item.order_count, totalOrders));
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.country}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.state}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.order_count}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant="outline" 
                            className={getIntensityColor(percentage)}
                          >
                            {percentage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
