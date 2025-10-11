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
  [key: string]: any;
}

// Audit logging helper
async function logAuditEvent(
  supabaseClient: any,
  actionType: string,
  entityType: string,
  entityId: string,
  details: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const { error } = await supabaseClient
      .from('audit_logs')
      .insert({
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details: details,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    
    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Error logging audit event:', err);
  }
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

    // Parse form data (CryptoCloud sends URL-encoded data)
    const contentType = req.headers.get('content-type') || '';
    let payload: CryptoCloudCallback;
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      console.log('Raw payload:', text);
      const params = new URLSearchParams(text);
      payload = Object.fromEntries(params.entries()) as CryptoCloudCallback;
    } else {
      payload = await req.json();
    }
    
    // Extract client information for audit logging
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    console.log('Received payment callback:', payload);

    // Log incoming payment callback
    await logAuditEvent(
      supabase,
      'payment_callback_received',
      'payment',
      payload.invoice_id,
      { 
        order_id: payload.order_id,
        status: payload.status,
        amount: payload.amount_crypto,
        currency: payload.currency
      },
      ipAddress,
      userAgent
    );

    // Verify the token from CryptoCloud
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload) + cryptoCloudSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex !== payload.token) {
      console.error('Invalid token signature');
      
      // Log signature verification failure
      await logAuditEvent(
        supabase,
        'payment_signature_invalid',
        'payment',
        payload.invoice_id,
        { 
          order_id: payload.order_id,
          reason: 'Token signature mismatch'
        },
        ipAddress,
        userAgent
      );
      
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

    // Store complete payment data in admin-only table for audit trail
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: parseInt(payload.order_id),
        invoice_id: payload.invoice_id,
        payment_status: payload.status,
        amount: payload.amount_crypto,
        currency: payload.currency,
        payment_method: payload.payment_method || 'crypto',
        raw_callback_data: payload,
        ip_address: ipAddress
      });

    if (transactionError) {
      console.error('Error storing payment transaction:', transactionError);
      // Continue anyway - order update is more critical for user experience
    }

    // Create sanitized payment details for orders table (user-accessible)
    // Trigger will further sanitize this data
    const sanitizedPaymentDetails = {
      order_id: payload.order_id,
      status: payload.status,
      amount: payload.amount_crypto,
      currency: payload.currency,
      invoice_id: payload.invoice_id,
      timestamp: new Date().toISOString()
    };

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: orderStatus,
        payment_details: sanitizedPaymentDetails
      })
      .eq('id', parseInt(payload.order_id))
      .select('*, order_details')
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      
      // Log order update failure
      await logAuditEvent(
        supabase,
        'payment_update_failed',
        'order',
        payload.order_id,
        { 
          error: updateError.message,
          invoice_id: payload.invoice_id
        },
        ipAddress,
        userAgent
      );
      
      return new Response(
        JSON.stringify({ error: 'Failed to update order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful payment processing
    if (orderStatus === 'completed') {
      await logAuditEvent(
        supabase,
        'payment_completed',
        'order',
        payload.order_id,
        { 
          invoice_id: payload.invoice_id,
          amount: payload.amount_crypto,
          currency: payload.currency,
          user_id: order?.user_id
        },
        ipAddress,
        userAgent
      );

      // Send email with purchased products
      if (order?.user_id) {
        const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
        
        if (userData?.user?.email) {
          console.log('Order completed for user:', userData.user.email);
          
          // Get product details from order
          const orderDetails = order.order_details as any;
          let productListHTML = '';
          let productListText = '';
          
          if (Array.isArray(orderDetails)) {
            productListHTML = orderDetails.map((item: any) => 
              `<li style="margin-bottom: 15px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
                <strong>${item.name_en || item.name_ru || 'Product'}</strong><br>
                Quantity: ${item.quantity}<br>
                ${item.preview_link ? `<a href="${item.preview_link}" style="color: #0070f3;">Download Link</a>` : ''}
              </li>`
            ).join('');
            
            productListText = orderDetails.map((item: any) => 
              `- ${item.name_en || item.name_ru || 'Product'} (Qty: ${item.quantity})${item.preview_link ? '\n  Link: ' + item.preview_link : ''}`
            ).join('\n');
          }

          // Send email via Resend API
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'STARK INC. <onboarding@resend.dev>',
                to: [userData.user.email],
                subject: `✅ Order #${order.id} - Your Digital Products`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333;">Thank you for your purchase!</h1>
                    <p style="font-size: 16px; color: #666;">Order ID: <strong>#${order.id}</strong></p>
                    <p style="font-size: 16px; color: #666;">Amount: <strong>$${order.amount}</strong></p>
                    
                    <h2 style="color: #333; margin-top: 30px;">Your Digital Products:</h2>
                    <ul style="list-style: none; padding: 0;">
                      ${productListHTML}
                    </ul>
                    
                    <div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 5px;">
                      <p style="margin: 0; font-size: 14px;">
                        Access your account at: 
                        <a href="https://4f73c965-e24b-4e86-b94a-67c413d6fd78.lovableproject.com/account" 
                           style="color: #0070f3; text-decoration: none;">
                          View My Orders
                        </a>
                      </p>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #999;">
                      If you have any questions, please contact our support team.
                    </p>
                  </div>
                `,
                text: `
Thank you for your purchase!

Order ID: #${order.id}
Amount: $${order.amount}

Your Digital Products:
${productListText}

Access your account at: https://4f73c965-e24b-4e86-b94a-67c413d6fd78.lovableproject.com/account

If you have any questions, please contact our support team.
                `
              }),
            });

            if (!emailResponse.ok) {
              const errorData = await emailResponse.json();
              console.error('Failed to send email:', errorData);
            } else {
              console.log('Purchase confirmation email sent to:', userData.user.email);
            }
          } catch (emailErr) {
            console.error('Error sending email:', emailErr);
          }
        }
      }
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
