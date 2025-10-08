import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: number;
  user_id: string;
  amount: number;
  status: string;
  order_details: any;
  payment_details: any;
  created_at: string;
  profiles: {
    email: string | null;
    username: string | null;
  } | null;
}

interface PaymentTransaction {
  id: string;
  invoice_id: string | null;
  payment_status: string | null;
  amount: number | null;
  currency: string | null;
  payment_method: string | null;
  raw_callback_data: any;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        profiles(email, username)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заказы",
        variant: "destructive",
      });
    } else {
      setOrders(data as any || []);
    }
    setLoading(false);
  }

  // Load full payment transaction details for selected order (admin only)
  async function loadPaymentTransactions(orderId: number) {
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading payment transactions:", error);
      setPaymentTransactions([]);
    } else {
      setPaymentTransactions(data || []);
    }
  }

  async function updateStatus(orderId: number, newStatus: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно",
        description: "Статус заказа обновлен",
      });
      loadOrders();
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление заказами</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по ID, пользователю..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Заказов не найдено
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="w-[220px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {order.profiles?.username || order.profiles?.email || "—"}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {order.user_id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>${order.amount}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString("ru-RU", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            loadPaymentTransactions(order.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Детали
                        </Button>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали заказа #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Полная информация о заказе
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    Статус
                  </h4>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    Сумма
                  </h4>
                  <p className="text-2xl font-bold">${selectedOrder.amount}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    Дата создания
                  </h4>
                  <p>
                    {new Date(selectedOrder.created_at).toLocaleDateString("ru-RU", {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    User ID
                  </h4>
                  <p className="font-mono text-xs break-all">{selectedOrder.user_id}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="font-semibold mb-2">Данные покупателя</h4>
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedOrder.profiles?.email || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Имя пользователя:</span>
                        <span>{selectedOrder.profiles?.username || "—"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Details */}
              {selectedOrder.order_details && (
                <div>
                  <h4 className="font-semibold mb-2">Состав заказа</h4>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {Array.isArray(selectedOrder.order_details.items) ? (
                          selectedOrder.order_details.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center border-b last:border-0 pb-2 last:pb-0">
                              <div>
                                <p className="font-medium">{item.name || "Товар"}</p>
                                <p className="text-sm text-muted-foreground">
                                  Количество: {item.quantity || 1}
                                </p>
                              </div>
                              <p className="font-semibold">${(item.price || 0).toFixed(2)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">Детали заказа недоступны</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Payment Details */}
              {selectedOrder.payment_details && (
                <div>
                  <h4 className="font-semibold mb-2">Данные оплаты (для пользователя)</h4>
                  <Card>
                    <CardContent className="pt-4">
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedOrder.payment_details, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Full Payment Transaction Details (Admin Only) */}
              {paymentTransactions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">
                    Полные данные о платеже (только для администраторов)
                  </h4>
                  <Card className="border-orange-500">
                    <CardContent className="pt-4">
                      {paymentTransactions.map((transaction) => (
                        <div key={transaction.id} className="space-y-3 mb-4 last:mb-0">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">ID транзакции:</span>
                              <p className="font-mono text-xs break-all">{transaction.id}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Invoice ID:</span>
                              <p className="font-mono text-xs">{transaction.invoice_id || "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Статус:</span>
                              <p>{transaction.payment_status || "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Сумма:</span>
                              <p>{transaction.amount ? `${transaction.amount} ${transaction.currency}` : "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Метод оплаты:</span>
                              <p>{transaction.payment_method || "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">IP адрес:</span>
                              <p className="font-mono text-xs">{transaction.ip_address || "—"}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Дата создания:</span>
                              <p>
                                {new Date(transaction.created_at).toLocaleDateString("ru-RU", {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          {transaction.raw_callback_data && (
                            <div>
                              <h5 className="text-sm font-semibold mb-1 text-orange-600">
                                ⚠️ Полные данные callback (конфиденциально)
                              </h5>
                              <pre className="text-xs bg-orange-50 dark:bg-orange-950 p-3 rounded overflow-x-auto border border-orange-200 dark:border-orange-800">
                                {JSON.stringify(transaction.raw_callback_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
