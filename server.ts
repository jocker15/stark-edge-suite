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

async function getSettings() {
  const { data, error } = await supabase.from('site_settings').select('key, value');
  
  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  const settings: Record<string, unknown> = {};
  data?.forEach((setting) => {
    settings[setting.key] = setting.value;
  });

  return settings;
}

async function getSetting(key: string) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }

  return data?.value;
}

async function sendEmailWithSettings(to: string, subject: string, html: string) {
  const emailSettings = await getSetting('email');
  
  let fromEmail = 'no-reply@starkedgestore.com';
  let fromName = 'Stark Edge Store';
  let apiKey = process.env.RESEND_API_KEY!;

  if (emailSettings && typeof emailSettings === 'object') {
    const settings = emailSettings as { sender_email?: string; sender_name?: string; resend_api_key?: string };
    if (settings.sender_email) fromEmail = settings.sender_email;
    if (settings.sender_name) fromName = settings.sender_name;
    if (settings.resend_api_key) apiKey = settings.resend_api_key;
  }

  const resendClient = new Resend(apiKey);
  
  return await resendClient.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html,
  });
}

app.use('/api/payment-webhook', bodyParser.raw({ type: 'application/json', verify: (req, res, buf) => { req.rawBody = buf; } }));

async function generateSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('digital-products')
    .createSignedUrl(filePath, 604800);
  
  if (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
  
  return data.signedUrl;
}

app.post('/api/orders/:orderId/resend-digital-goods', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    const { data: orderDetails, error: detailsError } = await supabase
      .rpc('get_order_details', { order_id_param: orderId });
    
    if (detailsError || !orderDetails) {
      console.error('Error fetching order details:', detailsError);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderDetails.order;
    const profile = orderDetails.profile;
    const products = orderDetails.products || [];

    if (!profile || !profile.email) {
      return res.status(400).json({ error: 'No customer email found' });
    }

    interface ProductWithFiles {
      is_digital?: boolean;
      files?: Array<{ file_name: string; file_path: string; file_size?: number }>;
      name_en?: string;
    }

    const digitalProducts = (products as ProductWithFiles[]).filter(
      (p) => p.is_digital && p.files && p.files.length > 0
    );

    if (digitalProducts.length === 0) {
      return res.status(400).json({ error: 'No digital products in this order' });
    }

    let emailHtml = `
      <h1>Digital Products Download - Order #${orderId}</h1>
      <p>Hello! Here are your digital products:</p>
    `;

    for (const product of digitalProducts) {
      emailHtml += `
        <h2>${product.name_en}</h2>
        <ul>
      `;
      
      for (const file of product.files) {
        try {
          const signedUrl = await generateSignedUrl(file.file_path);
          emailHtml += `<li><a href="${signedUrl}">${file.file_name}</a> (${file.file_size ? (file.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Size unknown'})</li>`;
        } catch (error) {
          console.error('Error generating signed URL for file:', file.file_name, error);
          emailHtml += `<li>${file.file_name} - Error generating download link</li>`;
        }
      }
      
      emailHtml += `</ul>`;
    }

    emailHtml += `
      <p>Download links are valid for 7 days.</p>
      <p>If you have any questions, please contact our support team.</p>
    `;

    const { error: emailError } = await sendEmailWithSettings(
      profile.email,
      `Digital Products Download - Order #${orderId}`,
      emailHtml
    );

    if (emailError) {
      console.error('Failed to send email:', emailError);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    await supabase.from('orders').update({
      delivery_status: 'delivered',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);

    await supabase.from('audit_logs').insert({
      entity_type: 'order',
      entity_id: orderId.toString(),
      action_type: 'resend_digital_goods',
      details: {
        product_count: digitalProducts.length,
        email: profile.email,
      },
    });

    console.log('Digital goods email sent successfully to:', profile.email);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error resending digital goods:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/orders/:orderId/send-email', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailHtml = `
      <h1>${subject}</h1>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        This email is regarding order #${orderId}<br>
        Stark Edge Store
      </p>
    `;

    const { error: emailError } = await sendEmailWithSettings(
      email,
      subject,
      emailHtml
    );

    if (emailError) {
      console.error('Failed to send email:', emailError);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    await supabase.from('audit_logs').insert({
      entity_type: 'order',
      entity_id: orderId.toString(),
      action_type: 'send_custom_email',
      details: {
        email,
        subject,
      },
    });

    console.log('Custom email sent successfully to:', email);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending custom email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
          const tempPassword = crypto.randomBytes(16).toString('hex'); // Secure random password
          const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: newUserId,
              email: data.customer_email,
              purchases: [orderDetails]
            });

          if (profileError) {
            console.error('Failed to insert profile:', profileError);
          }

          // Send password reset link instead of temp password
          const { error: resetError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: data.customer_email
          });

          if (resetError) {
            console.error('Failed to generate reset link:', resetError);
          }

          // Send confirmation email with products and login info
          interface OrderItem {
            name_en?: string;
            quantity?: number;
            price?: number;
          }
          const emailHtml = `
            <h1>Заказ #${orderId} Подтвержден</h1>
            <p>Ваш платеж получен. Спасибо за покупку!</p>
            <h2>Купленные товары:</h2>
            <ul>
              ${(orderDetails as OrderItem[]).map((item) => `<li>${item.name_en || 'Item'} - Количество: ${item.quantity || 1} - Цена: ${(item.price || 0).toFixed(2)}</li>`).join('')}
            </ul>
            <p>Итого: ${(order.amount || 0).toFixed(2)}</p>
            <h2>Информация для входа в аккаунт</h2>
            <p>Email: ${data.customer_email}</p>
            <p>Для установки пароля используйте ссылку для восстановления пароля, которая была отправлена на ваш email.</p>
            <p>Если у вас есть вопросы, свяжитесь со службой поддержки.</p>
          `;

          const { error: emailError } = await sendEmailWithSettings(
            data.customer_email,
            'Order Confirmed - Stark Edge Store',
            emailHtml
          );

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
                purchases: newPurchases
              })
              .eq('user_id', order.user_id);
    
            if (profileUpdateError) {
              console.error('Failed to update profile:', profileUpdateError);
            }
    
            // Send confirmation email
            interface EmailOrderItem {
              name_en?: string;
              quantity?: number;
              price?: number;
            }
            const orderDetailsForEmail = Array.isArray(order.order_details) ? order.order_details : [];
            const emailHtml = `
              <h1>Заказ #${orderId} Подтвержден</h1>
              <p>Ваш платеж получен. Спасибо за покупку!</p>
              <h2>Купленные товары:</h2>
              <ul>
                ${(orderDetailsForEmail as EmailOrderItem[]).map((item) => `<li>${item.name_en || 'Item'} - Количество: ${item.quantity || 1} - Цена: ${(item.price || 0).toFixed(2)}</li>`).join('')}
              </ul>
              <p>Итого: ${(order.amount || 0).toFixed(2)}</p>
              <p>Если у вас есть вопросы, свяжитесь со службой поддержки.</p>
            `;
    
            const { error: emailError } = await sendEmailWithSettings(
              profile.email,
              'Заказ Подтвержден - Stark Edge Store',
              emailHtml
            );
    
            if (emailError) {
              console.error('Failed to send email:', emailError);
            } else {
              console.log('Email sent successfully');
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