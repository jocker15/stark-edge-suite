import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Database } from './src/integrations/supabase/types';
import crypto from 'crypto';
import { Resend } from 'resend';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

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

// Trusted domains for CORS
const allowedOrigins = [
  'https://starkedge.store',
  'https://www.starkedge.store',
  process.env.SITE_URL,
].filter(Boolean) as string[];

// CORS configuration - restrict to trusted domains
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
}));

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://embed.tawk.to", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.cryptocloud.plus", "wss://"],
      frameSrc: ["'self'", "https://cryptocloud.plus"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limiting - general API limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 payment requests per windowMs
  message: { error: 'Too many payment requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

app.use(bodyParser.json());

// CSRF token generation and validation
const csrfTokens = new Map<string, { token: string; expires: number }>();

app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = req.headers['x-session-id'] as string || crypto.randomBytes(16).toString('hex');
  
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 3600000 // 1 hour
  });
  
  // Clean up expired tokens
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < Date.now()) {
      csrfTokens.delete(key);
    }
  }
  
  res.json({ token, sessionId });
});

// CSRF validation middleware for POST/PUT/DELETE
const validateCsrf = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip CSRF for webhook endpoints (they use signature verification)
  if (req.path.includes('webhook')) {
    return next();
  }
  
  const csrfToken = req.headers['x-csrf-token'] as string;
  const sessionId = req.headers['x-session-id'] as string;
  
  if (!csrfToken || !sessionId) {
    return res.status(403).json({ error: 'CSRF token required' });
  }
  
  const storedData = csrfTokens.get(sessionId);
  if (!storedData || storedData.token !== csrfToken || storedData.expires < Date.now()) {
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
  
  next();
};

// Get site URL from settings or env
async function getSiteUrl(): Promise<string> {
  const { data } = await supabase
    .from('site_settings')
    .select('general')
    .single();
  
  const general = data?.general as { site_url?: string } | null;
  return general?.site_url || process.env.SITE_URL || 'https://starkedge.store';
}

async function getSettings() {
  const { data, error } = await supabase.from('site_settings').select('key, value');
  
  if (error) {
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
    throw error;
  }
  
  return data.signedUrl;
}

// Input validation helper
function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

app.post('/api/orders/:orderId/resend-digital-goods', validateCsrf, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const siteUrl = await getSiteUrl();
    
    const { data: orderDetails, error: detailsError } = await supabase
      .rpc('get_order_details', { order_id_param: orderId });
    
    if (detailsError || !orderDetails) {
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
          emailHtml += `<li>${file.file_name} - Error generating download link</li>`;
        }
      }
      
      emailHtml += `</ul>`;
    }

    emailHtml += `
      <p>Download links are valid for 7 days.</p>
      <p>If you have any questions, please contact our support team.</p>
      <p><a href="${siteUrl}">Visit our store</a></p>
    `;

    const { error: emailError } = await sendEmailWithSettings(
      profile.email,
      `Digital Products Download - Order #${orderId}`,
      emailHtml
    );

    if (emailError) {
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

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/orders/:orderId/send-email', validateCsrf, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const { email, subject, message } = req.body;
    const siteUrl = await getSiteUrl();

    // Validate inputs
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({ error: 'Subject is required' });
    }
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const sanitizedSubject = sanitizeString(subject, 200);
    const sanitizedMessage = sanitizeString(message, 5000);

    const emailHtml = `
      <h1>${sanitizedSubject}</h1>
      <p>${sanitizedMessage.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        This email is regarding order #${orderId}<br>
        <a href="${siteUrl}">Stark Edge Store</a>
      </p>
    `;

    const { error: emailError } = await sendEmailWithSettings(
      email,
      sanitizedSubject,
      emailHtml
    );

    if (emailError) {
      return res.status(500).json({ error: 'Failed to send email' });
    }

    await supabase.from('audit_logs').insert({
      entity_type: 'order',
      entity_id: orderId.toString(),
      action_type: 'send_custom_email',
      details: {
        email,
        subject: sanitizedSubject,
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/payment-webhook', paymentLimiter, async (req, res) => {
  try {
    const signature = req.headers['x-cryptocloud-signature'] as string || req.headers['x-crypto-cloud-signature'] as string;
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const computedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(req.rawBody)
      .digest('hex');

    if (signature !== computedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    let body;
    try {
      body = JSON.parse(req.rawBody.toString());
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    const { event, data } = body;
    const siteUrl = await getSiteUrl();

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
          return res.status(500).json({ error: 'Failed to update order' });
        }

        // Handle new user creation if no user_id
        if (!order.user_id && data.customer_email) {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: data.customer_email,
            password: 'changeme123',
            email_confirm: true
          });

          if (createError || !newUser?.user) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const newUserId = newUser.user.id;

          // Update order with new user_id
          const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({ user_id: newUserId })
            .eq('id', orderId);

          if (orderUpdateError) {
            return res.status(500).json({ error: 'Failed to update order' });
          }

          // Insert profile for new user
          const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: newUserId,
              email: data.customer_email,
              purchases: [orderDetails]
            });

          // Send password reset link instead of temp password
          await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: data.customer_email
          });

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
            <p><a href="${siteUrl}">Перейти в магазин</a></p>
          `;

          await sendEmailWithSettings(
            data.customer_email,
            'Order Confirmed - Stark Edge Store',
            emailHtml
          );
        }
    
        if (order && order.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', order.user_id)
            .single();
    
          if (!profileError && profile && profile.email) {
            // Update purchases
            const currentPurchases = Array.isArray(profile.purchases) ? profile.purchases : [];
            const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
            const newPurchases = [...currentPurchases, orderDetails];
            await supabase
              .from('profiles')
              .update({
                purchases: newPurchases
              })
              .eq('user_id', order.user_id);
    
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
              <p><a href="${siteUrl}">Перейти в магазин</a></p>
            `;
    
            await sendEmailWithSettings(
              profile.email,
              'Заказ Подтвержден - Stark Edge Store',
              emailHtml
            );
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  // Server started
});