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
    const { email, cart, total } = await req.json();

    console.log('Creating guest order for email:', email);

    // Validate input
    if (!email || !cart || !total) {
      throw new Error('Missing required fields: email, cart, or total');
    }

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log('User already exists:', userId);
    } else {
      // Generate random password
      const tempPassword = crypto.randomUUID();

      // Create user with Supabase Auth
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false, // Email not confirmed yet
        user_metadata: {
          created_from: 'guest_checkout'
        }
      });

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        throw new Error(`Failed to create user: ${createUserError.message}`);
      }

      if (!newUser.user) {
        throw new Error('User creation failed - no user returned');
      }

      userId = newUser.user.id;
      console.log('New user created:', userId);

      // Generate magic link for auto-login
      const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      if (magicLinkError) {
        console.error('Error generating magic link:', magicLinkError);
      } else {
        console.log('Magic link generated for:', email);
      }
    }

    // Create order with the user_id
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        user_id: userId,
        status: 'pending',
        amount: total,
        order_details: cart
      }])
      .select('id')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log('Order created:', orderData.id);

    // Create payment via CryptoCloud
    const cryptoCloudApiKey = Deno.env.get('CRYPTOCLOUD_API_KEY');
    const cryptoCloudShopId = Deno.env.get('CRYPTOCLOUD_SHOP_ID');

    if (!cryptoCloudApiKey || !cryptoCloudShopId) {
      throw new Error('CryptoCloud credentials not configured');
    }

    const paymentResponse = await fetch('https://api.cryptocloud.plus/v2/invoice/create', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${cryptoCloudApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop_id: cryptoCloudShopId,
        amount: total.toString(),
        currency: 'USD',
        order_id: orderData.id.toString(),
        email: email,
      }),
    });

    const paymentData = await paymentResponse.json();
    console.log('Payment response:', paymentData);

    if (!paymentData.status || paymentData.status !== 'success') {
      throw new Error(paymentData.message || 'Failed to create payment');
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderData.id,
        userId: userId,
        paymentUrl: paymentData.result.link,
        invoiceId: paymentData.result.invoice_id,
        message: existingUser 
          ? 'Order created for existing account' 
          : 'Account created and confirmation email sent'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-guest-order function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});