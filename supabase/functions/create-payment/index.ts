import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Требуется авторизация');
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Неверный токен авторизации');
    }

    const { orderId, amount, currency = 'USD' } = await req.json();

    if (!orderId || !amount) {
      throw new Error('Отсутствуют обязательные параметры: orderId, amount');
    }

    // Get CryptoCloud credentials from environment
    const apiKey = Deno.env.get('CRYPTOCLOUD_API_KEY');
    const shopId = Deno.env.get('CRYPTOCLOUD_SHOP_ID');
    const secretKey = Deno.env.get('CRYPTOCLOUD_SECRET');

    if (!apiKey || !shopId || !secretKey) {
      throw new Error('Не настроены ключи CryptoCloud');
    }

    // Get the origin from request for redirect URLs
    const siteUrl = Deno.env.get('SITE_URL') || req.headers.get('origin') || '';
    if (!siteUrl) {
      throw new Error('SITE_URL not configured and no origin header present');
    }
    const origin = siteUrl;

    // Create invoice via CryptoCloud API
    const invoiceData = {
      shop_id: shopId,
      amount: amount.toString(),
      currency: currency,
      order_id: orderId.toString(),
      success_url: `${origin}/payment-success`,
      fail_url: `${origin}/payment-failed`,
    };

    const response = await fetch('https://api.cryptocloud.plus/v2/invoice/create', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    const result = await response.json();

    if (!response.ok || result.status !== 'success') {
      throw new Error(result.message || 'Ошибка создания платежа');
    }

    // Return the payment URL
    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: result.result.link,
        invoiceId: result.result.uuid,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});