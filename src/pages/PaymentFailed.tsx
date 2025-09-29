import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      // Update order status to failed
      const updateOrder = async () => {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', parseInt(invoiceId, 10));

        if (error) {
          console.error('Error updating order status:', error);
        }
        setLoading(false);
      };
      updateOrder();
    } else {
      setLoading(false);
    }
  }, [invoiceId]);

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

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Payment Failed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Unfortunately, your payment was not successful. Please try again or contact support if the problem persists.
            </p>
            {invoiceId && (
              <p className="text-sm text-muted-foreground">
                Order ID: {invoiceId}
              </p>
            )}
            <div className="flex gap-4">
              <Button asChild>
                <Link to="/cart">Return to Cart</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/game-accounts">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
