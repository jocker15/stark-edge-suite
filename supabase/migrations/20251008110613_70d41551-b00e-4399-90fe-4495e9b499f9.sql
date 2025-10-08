-- Удаляем все существующие SELECT политики для chat_sessions
DROP POLICY IF EXISTS "Only admins can view chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Service role can manage chat sessions" ON public.chat_sessions;

-- Пересоздаем политику service_role (необходима для edge functions)
CREATE POLICY "Service role can manage all chat sessions"
ON public.chat_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Создаем строгую политику только для админов
CREATE POLICY "Only authenticated admins can view chat sessions"
ON public.chat_sessions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Политика для INSERT (только service_role через edge functions)
CREATE POLICY "Only service role can insert chat sessions"
ON public.chat_sessions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Политика для UPDATE (только админы и service_role)
CREATE POLICY "Admins and service role can update chat sessions"
ON public.chat_sessions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Service role can update chat sessions"
ON public.chat_sessions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Политика для DELETE (только админы)
CREATE POLICY "Only admins can delete chat sessions"
ON public.chat_sessions
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Добавляем комментарий для документации
COMMENT ON TABLE public.chat_sessions IS 'Stores chat session data from Tawk.to. Contains PII (names, emails) - access restricted to admins only. Service role access required for webhook integration.';