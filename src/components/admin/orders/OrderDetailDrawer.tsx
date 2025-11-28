import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { orderManagerTranslations } from "@/lib/translations/order-manager";
import { Loader2, Download, Mail, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { OrderRow } from "./columns";
import { ResendDigitalGoodsDialog } from "./ResendDigitalGoodsDialog";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { RefundOrderDialog } from "./RefundOrderDialog";
import { MarkFailedDialog } from "./MarkFailedDialog";
import { SendOrderEmailDialog } from "./SendOrderEmailDialog";

interface OrderDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderRow | null;
  lang: "en" | "ru";
  onOrderUpdate?: () => void;
}

interface OrderDetails {
  order: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
  payment_transactions: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  audit_logs: Array<Record<string, unknown>>;
}

export function OrderDetailDrawer({
  open,
  onOpenChange,
  order,
  lang,
  onOrderUpdate,
}: OrderDetailDrawerProps) {
  const t = orderManagerTranslations[lang];
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [failedDialogOpen, setFailedDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  useEffect(() => {
    if (open && order) {
      loadOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order]);

  const loadOrderDetails = async () => {
    if (!order) return;

    setLoading(true);
    try {
      // Load order
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", order.id)
        .single();

      // Load payment transactions
      const { data: transactions } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false });

      // Load audit logs for this order
      const { data: logs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "order")
        .eq("entity_id", String(order.id))
        .order("created_at", { ascending: false });

      // Extract products from order_details
      const orderDetails = orderData?.order_details as { items?: Array<Record<string, unknown>> } | null;
      const products = orderDetails?.items || [];

      setDetails({
        order: orderData as Record<string, unknown> | null,
        profile: null,
        payment_transactions: transactions || [],
        products,
        audit_logs: logs || [],
      });
    } catch (error) {
      console.error("Error loading order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSuccess = () => {
    loadOrderDetails();
    onOrderUpdate?.();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      completed: "default",
      paid: "default",
      failed: "destructive",
      cancelled: "destructive",
      refunded: "secondary",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {t.status[status as keyof typeof t.status] || status}
      </Badge>
    );
  };

  const getDeliveryBadge = (status: string | null) => {
    if (!status) return <span className="text-muted-foreground">—</span>;
    
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      processing: "secondary",
      delivered: "default",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {t.deliveryStatus[status as keyof typeof t.deliveryStatus] || status}
      </Badge>
    );
  };

  if (!order) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t.drawer.title} #{order.id}</SheetTitle>
            <SheetDescription>
              {new Date(order.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="overview" className="mt-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">{t.drawer.tabs.overview}</TabsTrigger>
                <TabsTrigger value="products">{t.drawer.tabs.products}</TabsTrigger>
                <TabsTrigger value="payment">{t.drawer.tabs.payment}</TabsTrigger>
                <TabsTrigger value="timeline">{t.drawer.tabs.timeline}</TabsTrigger>
                <TabsTrigger value="actions">{t.drawer.tabs.actions}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.drawer.overview.orderInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.drawer.overview.orderId}</span>
                      <span className="font-mono">#{order.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.drawer.overview.status}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.drawer.overview.amount}</span>
                      <span className="font-bold text-lg">${order.amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.drawer.overview.created}</span>
                      <span>{new Date(order.created_at).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t.drawer.overview.customerInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {order.customer_email ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t.drawer.overview.email}</span>
                          <span>{order.customer_email}</span>
                        </div>
                        {order.customer_username && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.drawer.overview.username}</span>
                            <span>{order.customer_username}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t.drawer.overview.noCustomerInfo}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t.drawer.overview.deliveryInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.drawer.overview.deliveryStatus}</span>
                      {getDeliveryBadge(order.delivery_status)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.drawer.products.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {details?.products && details.products.length > 0 ? (
                      <div className="space-y-4">
                        {details.products.map((product, index) => {
                          const productData = product as { 
                            name_en?: string; 
                            name_ru?: string; 
                            is_digital?: boolean; 
                            price?: number;
                          };
                          
                          return (
                            <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium">
                                    {lang === "ru" ? productData.name_ru : productData.name_en}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {productData.is_digital ? (
                                      <Badge variant="secondary">{t.drawer.products.digital}</Badge>
                                    ) : (
                                      <Badge variant="outline">{t.drawer.products.physical}</Badge>
                                    )}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">${productData.price?.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t.drawer.products.noProducts}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4 mt-4">
                {details?.payment_transactions && details.payment_transactions.length > 0 ? (
                  details.payment_transactions.map((transaction) => {
                    const txData = transaction as {
                      id: string;
                      invoice_id?: string;
                      payment_status?: string;
                      payment_method?: string;
                      currency?: string;
                      ip_address?: string;
                      created_at: string;
                      raw_callback_data?: Record<string, unknown>;
                    };
                    
                    return (
                      <Card key={txData.id}>
                        <CardHeader>
                          <CardTitle>{t.drawer.payment.title}</CardTitle>
                          <CardDescription className="text-orange-600">
                            {t.drawer.payment.adminOnly}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.drawer.payment.transactionId}</span>
                            <span className="font-mono text-xs">{txData.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.drawer.payment.invoiceId}</span>
                            <span className="font-mono text-xs">{txData.invoice_id || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.drawer.payment.paymentStatus}</span>
                            {getStatusBadge(txData.payment_status || "pending")}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.drawer.payment.paymentMethod}</span>
                            <span>{txData.payment_method || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.drawer.payment.currency}</span>
                            <span>{txData.currency || "USD"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.drawer.payment.ipAddress}</span>
                            <span className="font-mono text-xs">{txData.ip_address || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.drawer.payment.timestamp}</span>
                            <span className="text-sm">
                              {new Date(txData.created_at).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}
                            </span>
                          </div>
                          
                          {txData.raw_callback_data && (
                            <div className="mt-4">
                              <h5 className="text-sm font-semibold mb-2 text-orange-600">
                                {t.drawer.payment.rawData}
                              </h5>
                              <pre className="text-xs bg-orange-50 dark:bg-orange-950 p-3 rounded overflow-x-auto border border-orange-200 dark:border-orange-800 max-h-64">
                                {JSON.stringify(txData.raw_callback_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground text-center">
                        {t.drawer.payment.noPayment}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.drawer.timeline.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {details?.audit_logs && details.audit_logs.length > 0 ? (
                      <div className="space-y-4">
                        {details.audit_logs.map((log) => {
                          const logData = log as {
                            id: string;
                            action_type: string;
                            created_at: string;
                            details?: Record<string, unknown>;
                          };
                          
                          return (
                            <div key={logData.id} className="border-l-2 border-primary pl-4 pb-4 last:pb-0">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium">{logData.action_type}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(logData.created_at).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}
                                </span>
                              </div>
                              {logData.details && (
                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto mt-2">
                                  {JSON.stringify(logData.details, null, 2)}
                                </pre>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">
                        {t.drawer.timeline.noTimeline}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.drawer.actions.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setEmailDialogOpen(true)}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {t.drawer.actions.email}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setResendDialogOpen(true)}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t.drawer.actions.resend}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                        onClick={() => setCancelDialogOpen(true)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {t.drawer.actions.cancel}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-orange-600 border-orange-600 hover:bg-orange-50"
                        onClick={() => setRefundDialogOpen(true)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t.drawer.actions.refund}
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full col-span-2"
                        onClick={() => setFailedDialogOpen(true)}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        {t.drawer.actions.failed}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      <SendOrderEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        orderId={order.id}
        customerEmail={order.customer_email}
        lang={lang}
        onSuccess={handleActionSuccess}
      />

      <ResendDigitalGoodsDialog
        open={resendDialogOpen}
        onOpenChange={setResendDialogOpen}
        orderId={order.id}
        customerEmail={order.customer_email}
        lang={lang}
        onSuccess={handleActionSuccess}
      />

      <CancelOrderDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        orderId={order.id}
        lang={lang}
        onSuccess={handleActionSuccess}
      />

      <RefundOrderDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        orderId={order.id}
        orderAmount={order.amount || 0}
        lang={lang}
        onSuccess={handleActionSuccess}
      />

      <MarkFailedDialog
        open={failedDialogOpen}
        onOpenChange={setFailedDialogOpen}
        orderId={order.id}
        lang={lang}
        onSuccess={handleActionSuccess}
      />
    </>
  );
}
