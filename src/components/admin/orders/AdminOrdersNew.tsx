import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { orderManagerTranslations } from "@/lib/translations/order-manager";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, RefreshCw, Download } from "lucide-react";
import { OrdersDataTable } from "./OrdersDataTable";
import { OrderFilters, OrderFiltersType } from "./OrderFilters";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { getColumns, OrderRow } from "./columns";
import { PaginationState } from "@tanstack/react-table";

export function AdminOrdersNew() {
  const { language } = useLanguage();
  const t = orderManagerTranslations[language];
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const [filters, setFilters] = useState<OrderFiltersType>({
    search: "",
    orderStatus: "all",
    paymentStatus: "all",
    deliveryStatus: "all",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
  });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_filtered_orders", {
        search_param: filters.search || null,
        status_filter: filters.orderStatus === "all" ? null : filters.orderStatus,
        payment_status_filter: filters.paymentStatus === "all" ? null : filters.paymentStatus,
        delivery_status_filter: filters.deliveryStatus === "all" ? null : filters.deliveryStatus,
        date_from: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : null,
        date_to: filters.dateTo ? new Date(filters.dateTo).toISOString() : null,
        min_amount: filters.minAmount ? parseFloat(filters.minAmount) : null,
        max_amount: filters.maxAmount ? parseFloat(filters.maxAmount) : null,
        limit_param: pagination.pageSize,
        offset_param: pagination.pageIndex * pagination.pageSize,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setOrders(data);
        setTotalCount(data[0].total_count || 0);
      } else {
        setOrders([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: language === "ru" ? "Ошибка" : "Error",
        description: t.error,
        variant: "destructive",
      });
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination, language, toast, t.error]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleViewDetails = (order: OrderRow) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const handleFiltersChange = (newFilters: OrderFiltersType) => {
    setFilters(newFilters);
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Order ID", "Date", "Customer Email", "Amount", "Order Status", "Payment Status", "Delivery Status"],
      ...orders.map(order => [
        order.id.toString(),
        new Date(order.created_at).toLocaleDateString(),
        order.customer_email || "",
        order.amount?.toFixed(2) || "0.00",
        order.status,
        order.payment_status || "",
        order.delivery_status || "",
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: language === "ru" ? "Успешно" : "Success",
      description: language === "ru" ? "CSV файл экспортирован" : "CSV file exported",
    });
  };

  const columns = getColumns(language, handleViewDetails);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadOrders}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {t.refresh}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={orders.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {t.actions.exportCSV}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <OrderFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            lang={language}
          />

          <OrdersDataTable
            columns={columns}
            data={orders}
            totalCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            lang={language}
            loading={loading}
          />
        </CardContent>
      </Card>

      <OrderDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        order={selectedOrder}
        lang={language}
        onOrderUpdate={loadOrders}
      />
    </>
  );
}
