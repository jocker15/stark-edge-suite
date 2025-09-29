import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CryptoCloudCallback {
  invoice_id: string;
  amount_crypto: string;
  currency: string;
  order_id: string;
  status: string;
  token: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cryptoCloudSecret = Deno.env.get('CRYPTOCLOUD_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: CryptoCloudCallback = await req.json();
    
    console.log('Received payment callback:', payload);

    // Verify the token from CryptoCloud
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload) + cryptoCloudSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex !== payload.token) {
      console.error('Invalid token signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status based on payment status
    const orderStatus = payload.status === 'success' || payload.status === 'paid' 
      ? 'completed' 
      : payload.status === 'partial' 
      ? 'partial' 
      : 'failed';

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: orderStatus,
        payment_details: payload
      })
      .eq('id', parseInt(payload.order_id))
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order updated successfully:', order);

    return new Response(
      JSON.stringify({ success: true, order }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
