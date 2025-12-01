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
  const { lang } = useLanguage();
  const t = orderManagerTranslations[lang];
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
      // Build query directly - no join since there's no FK relationship
      let query = supabase
        .from("orders")
        .select("*", { count: "exact" });

      // Apply filters
      if (filters.orderStatus !== "all") {
        query = query.eq("status", filters.orderStatus);
      }

      if (filters.paymentStatus !== "all") {
        query = query.eq("payment_status", filters.paymentStatus);
      }

      if (filters.deliveryStatus !== "all") {
        query = query.eq("delivery_status", filters.deliveryStatus);
      }

      if (filters.search) {
        query = query.or(`customer_email.ilike.%${filters.search}%,invoice_id.ilike.%${filters.search}%`);
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", new Date(filters.dateFrom).toISOString());
      }

      if (filters.dateTo) {
        query = query.lte("created_at", new Date(filters.dateTo).toISOString());
      }

      if (filters.minAmount) {
        const minVal = parseFloat(filters.minAmount);
        if (!isNaN(minVal)) {
          query = query.gte("amount", minVal);
        }
      }

      if (filters.maxAmount) {
        const maxVal = parseFloat(filters.maxAmount);
        if (!isNaN(maxVal)) {
          query = query.lte("amount", maxVal);
        }
      }

      // Apply pagination
      const from = pagination.pageIndex * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to match OrderRow type
      const transformedOrders: OrderRow[] = (data || []).map((order) => ({
        id: order.id,
        user_id: order.user_id,
        amount: order.amount,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at || order.created_at,
        customer_email: order.customer_email || null,
        customer_username: order.customer_username || null,
        payment_status: order.payment_status || null,
        delivery_status: order.delivery_status || null,
        order_details: order.order_details as Record<string, unknown> | null,
        payment_details: order.payment_details as Record<string, unknown> | null,
        invoice_id: order.invoice_id || null,
        total_count: count || 0,
      }));

      setOrders(transformedOrders);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: lang === "ru" ? "Ошибка" : "Error",
        description: t.error,
        variant: "destructive",
      });
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination, lang, toast, t.error]);

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
      title: lang === "ru" ? "Успешно" : "Success",
      description: lang === "ru" ? "CSV файл экспортирован" : "CSV file exported",
    });
  };

  const columns = getColumns(lang, handleViewDetails);

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
            lang={lang}
          />

          <OrdersDataTable
            columns={columns}
            data={orders}
            totalCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            lang={lang}
            loading={loading}
          />
        </CardContent>
      </Card>

      <OrderDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        order={selectedOrder}
        lang={lang}
        onOrderUpdate={loadOrders}
      />
    </>
  );
}
