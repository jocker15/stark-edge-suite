-- Create error_logs table for tracking client-side and server-side errors
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to view all error logs
CREATE POLICY "Admins can view error logs" ON error_logs
FOR SELECT USING (public.has_role_hierarchy(auth.uid(), 'admin'::app_role));

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_level_idx ON error_logs(level);
