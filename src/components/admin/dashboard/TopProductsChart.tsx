import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getTranslation } from "@/lib/translations/dashboard";

interface TopProductData {
  product_id: number;
  product_name: string;
  sales_count: number;
  revenue: number;
}

interface TopProductsChartProps {
  data: TopProductData[];
  loading: boolean;
  language: 'en' | 'ru';
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function TopProductsChart({ data, loading, language }: TopProductsChartProps) {
  const t = (key: string) => getTranslation(language, key);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const chartData = data.map(item => ({
    name: truncateText(item.product_name),
    [t('charts.salesCount')]: item.sales_count,
    [t('charts.revenue')]: item.revenue,
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-72" />
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
        <CardTitle>{t('charts.topProducts')}</CardTitle>
        <CardDescription>{t('charts.topProductsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t('charts.noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                type="category"
                dataKey="name"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number | string, name: string) => {
                  if (name === t('charts.revenue')) {
                    return [formatCurrency(Number(value)), name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey={t('charts.salesCount')} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
