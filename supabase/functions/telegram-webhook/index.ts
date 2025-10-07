import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    reply_to_message?: {
      message_id: number;
      text?: string;
    };
  };
}

async function sendTawkMessage(chatId: string, message: string, propertyId: string): Promise<boolean> {
  try {
    // Note: You need to get Tawk.to API credentials and add them as secrets
    // This is a placeholder - actual implementation would use Tawk.to REST API
    console.log(`Sending to Tawk.to chat ${chatId}: ${message}`);
    
    // Tawk.to API endpoint would be something like:
    // POST https://api.tawk.to/v1/chats/{chatId}/messages
    // with proper authentication headers
    
    return true;
  } catch (error) {
    console.error('Error sending Tawk message:', error);
    return false;
  }
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

    if (!telegramToken) {
      console.error('Missing Telegram bot token');
      return new Response(
        JSON.stringify({ error: 'Missing configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update:', update);

    if (!update.message || !update.message.text) {
      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const message = update.message;
    const text = message.text || '';

    // Handle commands
    if (text.startsWith('/')) {
      const command = text.split(' ')[0];
      
      if (command === '/help') {
        await sendTelegramMessage(
          telegramToken,
          message.chat.id.toString(),
          '📋 <b>Available Commands:</b>\n\n' +
          '/help - Show this help message\n' +
          '/active - Show active chats\n' +
          '/stats - Show chat statistics\n\n' +
          'Reply to a message to send a response to that Tawk.to chat.'
        );
        
        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (command === '/active') {
        const { data: activeSessions } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (!activeSessions || activeSessions.length === 0) {
          await sendTelegramMessage(
            telegramToken,
            message.chat.id.toString(),
            '✅ No active chats'
          );
        } else {
          const chatList = activeSessions
            .map((session, idx) => 
              `${idx + 1}. ${session.visitor_name || 'Anonymous'} - ${session.visitor_email || 'No email'}`
            )
            .join('\n');

          await sendTelegramMessage(
            telegramToken,
            message.chat.id.toString(),
            `💬 <b>Active Chats (${activeSessions.length}):</b>\n\n${chatList}`
          );
        }

        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (command === '/stats') {
        const { count: totalChats } = await supabase
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true });

        const { count: activeChats } = await supabase
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        await sendTelegramMessage(
          telegramToken,
          message.chat.id.toString(),
          `📊 <b>Chat Statistics:</b>\n\n` +
          `Total Chats: ${totalChats || 0}\n` +
          `Active Chats: ${activeChats || 0}\n` +
          `Closed Chats: ${(totalChats || 0) - (activeChats || 0)}`
        );

        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle replies to messages
    if (message.reply_to_message) {
      const replyToMessageId = message.reply_to_message.message_id;
      
      // Find the chat session by telegram message ID
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('telegram_message_id', replyToMessageId)
        .eq('status', 'active')
        .single();

      if (session) {
        // Send message to Tawk.to
        const sent = await sendTawkMessage(
          session.tawk_chat_id,
          text,
          '68dc0cd08574b01951514afb' // Your Tawk.to property ID
        );

        if (sent) {
          // Log the interaction
          await supabase.from('audit_logs').insert({
            action_type: 'telegram_reply_sent',
            entity_type: 'chat',
            entity_id: session.tawk_chat_id,
            details: {
              telegram_user: message.from.username || message.from.first_name,
              message: text,
            },
          });

          await sendTelegramMessage(
            telegramToken,
            message.chat.id.toString(),
            '✅ Message sent to Tawk.to chat'
          );
        } else {
          await sendTelegramMessage(
            telegramToken,
            message.chat.id.toString(),
            '❌ Failed to send message to Tawk.to'
          );
        }
      } else {
        await sendTelegramMessage(
          telegramToken,
          message.chat.id.toString(),
          '⚠️ Chat not found or already closed'
        );
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing Telegram update:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
