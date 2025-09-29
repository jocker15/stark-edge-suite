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
    if (invoiceId) {
      fetchOrder();
    } else {
      setError('No invoice ID found');
      setLoading(false);
    }
  }, [invoiceId]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', parseInt(invoiceId || '0', 10))
      .maybeSingle();

    if (fetchError) {
      console.error(fetchError);
      setError('Failed to fetch order');
    } else if (data) {
      const orderDetails = (data.order_details as unknown as OrderDetail[]) || [];
      const updatedOrder = { ...data, order_details: orderDetails } as Order;
      setOrder(updatedOrder);
      // Clear cart if user is logged in (has user_id)
      if (updatedOrder.user_id) {
        clearCart();
      }
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
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Order ID: {order?.id}</p>
            <h3 className="font-semibold">Products:</h3>
            <div className="space-y-2">
              {order?.order_details.map((detail, index) => (
                <div key={index} className="flex justify-between">
                  <span>{detail.product_name}</span>
                  <span>Quantity: {detail.quantity}</span>
                </div>
              ))}
            </div>
            <Button asChild className="mt-4">
              <Link to="/account">Go to Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default PaymentSuccess;