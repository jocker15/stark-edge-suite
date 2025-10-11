import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OrderDetail {
  product_name: string;
  quantity: number;
  // Add other fields as needed, e.g., price
}

interface Order {
  id: number;
  status: string;
  amount: number | null;
  user_id: string | null;
  order_details: OrderDetail[];
  // Add other fields as needed
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to get order_id from URL params (invoice_id or order_id)
    const orderId = invoiceId || searchParams.get('order_id');
    
    if (orderId) {
      fetchOrder(orderId);
    } else {
      // Try to get the most recent pending/completed order for this user
      fetchRecentOrder();
    }
  }, [invoiceId]);

  const fetchRecentOrder = async () => {
    setLoading(true);
    setError(null);
    
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      setError('Please sign in to view your order');
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error(fetchError);
      setError('Failed to fetch order');
    } else if (data) {
      const orderDetails = (data.order_details as unknown as OrderDetail[]) || [];
      const updatedOrder = { ...data, order_details: orderDetails } as Order;
      setOrder(updatedOrder);
      clearCart();
    } else {
      setError('No recent order found');
    }
    setLoading(false);
  };

  const fetchOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', parseInt(orderId, 10))
      .maybeSingle();

    if (fetchError) {
      console.error(fetchError);
      setError('Failed to fetch order');
    } else if (data) {
      const orderDetails = (data.order_details as unknown as OrderDetail[]) || [];
      const updatedOrder = { ...data, order_details: orderDetails } as Order;
      setOrder(updatedOrder);
      clearCart();
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-8">
          <p>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-8">
          <p>{error || 'Order not found'}</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">🎉 Оплата успешна!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Номер заказа</p>
              <p className="text-xl font-bold">#{order?.id}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Приобретенные товары:</h3>
              <div className="space-y-3">
                {order?.order_details.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">{detail.product_name}</span>
                    <span className="text-muted-foreground">x{detail.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm mb-2">✅ Товары отправлены на вашу почту</p>
              <p className="text-sm">✅ Доступ к личному кабинету активирован</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="w-full">
                <Link to="/account">Перейти в личный кабинет</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to="/">На главную</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default PaymentSuccess;