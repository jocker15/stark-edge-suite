import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Database } from './src/integrations/supabase/types';
import crypto from 'crypto';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const resend = new Resend(process.env.RESEND_API_KEY!);

const secretKey = process.env.CRYPTOCLOUD_SECRET!;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/payment-webhook', bodyParser.raw({ type: 'application/json', verify: (req, res, buf) => { req.rawBody = buf; } }));

app.post('/api/payment-webhook', async (req, res) => {
  try {
    console.log('Webhook received');
    console.log('Headers:', req.headers);
    console.log('RawBody length:', req.rawBody ? req.rawBody.length : 'no rawBody');
    const signature = req.headers['x-cryptocloud-signature'] as string || req.headers['x-crypto-cloud-signature'] as string;
    if (!signature) {
      console.log('No signature found');
      return res.status(401).json({ error: 'Missing signature' });
    }
    console.log('Signature:', signature);

    const computedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(req.rawBody)
      .digest('hex');

    console.log('Computed signature:', computedSignature);
    if (signature !== computedSignature) {
      console.error('Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    let body;
    try {
      body = JSON.parse(req.rawBody.toString());
      console.log('Webhook received:', body);
    } catch (e) {
      console.error('Invalid JSON:', e);
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    const { event, data } = body;
    console.log('Customer email:', data.customer_email);

    if (event === 'invoice_status_changed' && data.status === 'paid') {
      const orderId = data.custom?.order_id;
      if (orderId) {
        const { error: updateError, data: order } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            amount: data.amount,
            invoice_id: data.id
          })
          .eq('id', orderId)
          .select('*')
          .single();
    
        if (updateError) {
          console.error('Failed to update order:', updateError);
          return res.status(500).json({ error: 'Failed to update order' });
        }

        console.log(data);

        // Handle new user creation if no user_id
        if (!order.user_id && data.customer_email) {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: data.customer_email,
            password: 'changeme123',
            email_confirm: true
          });

          if (createError || !newUser?.user) {
            console.error('Failed to create user:', createError);
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const newUserId = newUser.user.id;

          // Update order with new user_id
          const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({ user_id: newUserId })
            .eq('id', orderId);

          if (orderUpdateError) {
            console.error('Failed to update order with user_id:', orderUpdateError);
            return res.status(500).json({ error: 'Failed to update order' });
          }

          // Insert profile for new user
          const tempPassword = 'changeme123';
          const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: newUserId,
              email: data.customer_email,
              temp_password: tempPassword,
              purchases: [orderDetails]
            });

          if (profileError) {
            console.error('Failed to insert profile:', profileError);
          }

          // Send confirmation email with products and login info
          const emailHtml = `
            <h1>Order #${orderId} Confirmed</h1>
            <p>Your payment has been received. Thank you for your purchase!</p>
            <h2>Purchased Items:</h2>
            <ul>
              ${orderDetails.map((item: any) => `<li>${item.name_en || 'Item'} - Quantity: ${item.quantity || 1} - Price: $${(item.price || 0).toFixed(2)}</li>`).join('')}
            </ul>
            <p>Total: $${(order.amount || 0).toFixed(2)}</p>
            <h2>Account Login Information</h2>
            <p>Email: ${data.customer_email}</p>
            <p>Temporary Password: ${tempPassword}</p>
            <p>Please log in to your account at <a href="http://localhost:5173/account">Stark Edge Account</a> and change your password immediately for security.</p>
            <p>If you have any questions, contact support.</p>
          `;

          const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'no-reply@starkedgestore.com',
            to: data.customer_email,
            subject: 'Order Confirmed - Stark Edge Store',
            html: emailHtml,
          });

          if (emailError) {
            console.error('Failed to send email:', emailError);
          } else {
            console.log('Email sent successfully to new user');
          }
        }
    
        if (order && order.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', order.user_id)
            .single();
    
          if (profileError || !profile) {
            console.error('Profile not found:', profileError);
          } else if (profile.email) {
            // Update purchases
            const currentPurchases = Array.isArray(profile.purchases) ? profile.purchases : [];
            const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
            const newPurchases = [...currentPurchases, orderDetails];
            const { error: profileUpdateError } = await supabase
              .from('profiles')
              .update({
                purchases: newPurchases,
                temp_password: null
              })
              .eq('user_id', order.user_id);
    
            if (profileUpdateError) {
              console.error('Failed to update profile:', profileUpdateError);
            }
    
            // Send email
            if (profile.temp_password) {
              const orderDetailsForEmail = Array.isArray(order.order_details) ? order.order_details : [];
              const emailHtml = `
                <h1>Order #${orderId} Confirmed</h1>
                <p>Your payment has been received. Thank you for your purchase!</p>
                <h2>Purchased Items:</h2>
                <ul>
                  ${orderDetailsForEmail.map((item: any) => `<li>${item.name_en || 'Item'} - Quantity: ${item.quantity || 1} - Price: $${(item.price || 0).toFixed(2)}</li>`).join('')}
                </ul>
                <p>Total: $${(order.amount || 0).toFixed(2)}</p>
                <h2>Account Login Information</h2>
                <p>Email: ${profile.email}</p>
                <p>Temporary Password: ${profile.temp_password}</p>
                <p>Please log in to your account at <a href="http://localhost:5173/account">Stark Edge Account</a> and change your password immediately for security.</p>
                <p>If you have any questions, contact support.</p>
              `;
    
              const { data: emailData, error: emailError } = await resend.emails.send({
                from: 'no-reply@starkedgestore.com',
                to: profile.email,
                subject: 'Order Confirmed - Stark Edge Store',
                html: emailHtml,
              });
    
              if (emailError) {
                console.error('Failed to send email:', emailError);
              } else {
                console.log('Email sent successfully');
              }
            }
          }
        }
    
        console.log('Order processed successfully');
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Webhook server running on port ${port}`);
});