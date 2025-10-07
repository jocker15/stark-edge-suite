-- Create chat_sessions table for Tawk.to <-> Telegram integration
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tawk_chat_id TEXT NOT NULL,
  telegram_message_id BIGINT,
  visitor_name TEXT,
  visitor_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_tawk_chat_id ON public.chat_sessions(tawk_chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_telegram_message_id ON public.chat_sessions(telegram_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.chat_sessions(status);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can manage chat sessions
CREATE POLICY "Service role can manage chat sessions"
  ON public.chat_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_sessions_updated_at();