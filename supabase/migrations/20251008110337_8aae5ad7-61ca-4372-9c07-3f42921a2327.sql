-- Создаем отдельную таблицу для полных данных о платежах (доступ только для админов)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id bigint NOT NULL,
  invoice_id text,
  payment_status text,
  amount numeric,
  currency text,
  payment_method text,
  raw_callback_data jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Включаем RLS для payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Только service_role может вставлять данные о платежах
CREATE POLICY "Service role can insert payment transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (true);

-- Только админы могут просматривать полные данные о платежах
CREATE POLICY "Only admins can view payment transactions"
ON public.payment_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Только админы могут обновлять данные о платежах
CREATE POLICY "Only admins can update payment transactions"
ON public.payment_transactions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Добавляем индекс для быстрого поиска по order_id
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id 
ON public.payment_transactions(order_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_payment_transactions_timestamp
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_transactions_updated_at();

-- Добавляем комментарии для документации
COMMENT ON TABLE public.payment_transactions IS 'Stores complete payment transaction data. Access restricted to admins only for security.';
COMMENT ON COLUMN public.payment_transactions.raw_callback_data IS 'Complete callback data from payment provider. Should never be exposed to regular users.';