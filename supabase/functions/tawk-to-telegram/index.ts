import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tawk-signature',
};

interface TawkWebhookPayload {
  event: string;
  chatId: string;
  time: string;
  property: {
    id: string;
    name: string;
  };
  visitor: {
    name: string;
    email?: string;
    city?: string;
    country?: string;
  };
  message?: {
    text: string;
    type: string;
  };
  requester?: string;
}

async function verifyTawkSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const hash = Array.from(new Uint8Array(signed))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return hash === signature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string, parseMode = 'HTML'): Promise<number | null> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    console.log('Telegram API response:', data);
    
    if (!data.ok) {
      console.error('Telegram API error:', data);
      return null;
    }
    
    return data.result.message_id;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return null;
  }
}

function formatTawkMessage(payload: TawkWebhookPayload): string {
  const { event, visitor, message, chatId } = payload;
  
  const visitorInfo = `
👤 <b>Visitor:</b> ${visitor.name || 'Anonymous'}
${visitor.email ? `📧 <b>Email:</b> ${visitor.email}` : ''}
${visitor.city ? `📍 <b>Location:</b> ${visitor.city}, ${visitor.country}` : ''}
  `.trim();

  const chatLink = `\n🔗 <a href="https://dashboard.tawk.to/#/chat/${chatId}">Open in Tawk.to</a>`;
  
  if (event === 'chat:start') {
    return `🆕 <b>New Chat Started</b>\n\n${visitorInfo}${chatLink}`;
  }
  
  if (event === 'chat:message' && message) {
    const messageType = message.type === 'visitor' ? '💬 Visitor' : '👨‍💼 Agent';
    return `${messageType}: ${message.text}\n\n${visitorInfo}${chatLink}`;
  }
  
  if (event === 'chat:end') {
    return `✅ <b>Chat Ended</b>\n\n${visitorInfo}${chatLink}`;
  }
  
  if (event === 'ticket:create') {
    return `🎫 <b>New Ticket Created</b>\n\n${visitorInfo}${chatLink}`;
  }
  
  return `📢 <b>Tawk.to Event:</b> ${event}\n\n${visitorInfo}${chatLink}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
    const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID')!;
    const tawkSecret = Deno.env.get('TAWK_TO_WEBHOOK_SECRET')!;

    if (!telegramToken || !telegramChatId || !tawkSecret) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Missing configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signature = req.headers.get('x-tawk-signature');
    const body = await req.text();
    
    console.log('Received webhook with signature:', signature);
    
    // Verify webhook signature
    if (signature && tawkSecret) {
      const isValid = await verifyTawkSignature(body, signature, tawkSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const payload: TawkWebhookPayload = JSON.parse(body);
    console.log('Webhook payload:', payload);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Format and send message to Telegram
    const message = formatTawkMessage(payload);
    const messageId = await sendTelegramMessage(telegramToken, telegramChatId, message);

    if (!messageId) {
      throw new Error('Failed to send Telegram message');
    }

    // Save or update chat session
    if (payload.event === 'chat:start') {
      await supabase.from('chat_sessions').insert({
        tawk_chat_id: payload.chatId,
        telegram_message_id: messageId,
        visitor_name: payload.visitor.name,
        visitor_email: payload.visitor.email,
        status: 'active',
      });
    } else if (payload.event === 'chat:end') {
      await supabase
        .from('chat_sessions')
        .update({ status: 'closed' })
        .eq('tawk_chat_id', payload.chatId);
    }

    // Log to audit_logs
    await supabase.from('audit_logs').insert({
      action_type: 'tawk_webhook_received',
      entity_type: 'chat',
      entity_id: payload.chatId,
      details: {
        event: payload.event,
        visitor: payload.visitor,
        telegram_message_id: messageId,
      },
    });

    return new Response(
      JSON.stringify({ success: true, messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
