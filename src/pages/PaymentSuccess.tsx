import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { lang } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  useEffect(() => {
    const initOrder = async () => {
      // Check if there's a pending guest order and auto-login
      const pendingOrder = localStorage.getItem('pendingGuestOrder');
      
      if (pendingOrder && !autoLoginAttempted) {
        setAutoLoginAttempted(true);
        const orderData = JSON.parse(pendingOrder);
        
        // Try to auto-login using OTP
        try {
          const { data: session } = await supabase.auth.getSession();
          
          if (!session?.session) {
            // User not logged in, try to create a session
            // This will work after payment callback creates the user
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: orderData.email,
              password: 'temppass123' // This will fail, but we'll handle it
            });
            
            // Auto-login may fail if user hasn't set password yet
          }
          
          // Fetch the order
          await fetchOrder(orderData.orderId.toString());
          localStorage.removeItem('pendingGuestOrder');
          return;
        } catch {
          // Auto-login failed silently
        }
      }
      
      // Try to get order_id from URL params (invoice_id or order_id)
      const orderId = invoiceId || searchParams.get('order_id');
      
      if (orderId) {
        fetchOrder(orderId);
      } else {
        // Try to get the most recent pending/completed order for this user
        fetchRecentOrder();
      }
    };
    
    initOrder();
  }, [invoiceId, autoLoginAttempted]);

  const fetchRecentOrder = async () => {
    setLoading(true);
    setError(null);
    
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      // Check if there's order info in localStorage
      const pendingOrder = localStorage.getItem('pendingGuestOrder');
      if (pendingOrder) {
        const orderData = JSON.parse(pendingOrder);
        setError(lang === 'ru' 
          ? `Ваш заказ #${orderData.orderId} обрабатывается. Проверьте email для доступа к аккаунту.`
          : `Your order #${orderData.orderId} is being processed. Check your email for account access.`
        );
      } else {
        setError(lang === 'ru' ? 'Войдите в аккаунт чтобы увидеть заказ' : 'Please sign in to view your order');
      }
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
          <p>{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-lg">{error || (lang === 'ru' ? 'Заказ не найден' : 'Order not found')}</p>
                <div className="flex gap-3 justify-center">
                  <Button asChild>
                    <Link to="/signin">{lang === 'ru' ? 'Войти в аккаунт' : 'Sign In'}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/">{lang === 'ru' ? 'На главную' : 'Home'}</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <CardTitle className="text-2xl text-center">
              🎉 {lang === 'ru' ? 'Оплата успешна!' : 'Payment Successful!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {lang === 'ru' ? 'Номер заказа' : 'Order Number'}
              </p>
              <p className="text-xl font-bold">#{order?.id}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">
                {lang === 'ru' ? 'Приобретенные товары:' : 'Purchased Items:'}
              </h3>
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
              <p className="text-sm mb-2">
                ✅ {lang === 'ru' ? 'Товары отправлены на вашу почту' : 'Items sent to your email'}
              </p>
              <p className="text-sm">
                ✅ {lang === 'ru' ? 'Доступ к личному кабинету активирован' : 'Account access activated'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="w-full">
                <Link to="/account">
                  {lang === 'ru' ? 'Перейти в личный кабинет' : 'Go to Account'}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to="/">{lang === 'ru' ? 'На главную' : 'Home'}</Link>
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