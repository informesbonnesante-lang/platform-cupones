-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase para crear la tabla de cupones

CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  patient_ci TEXT NOT NULL,
  service_category TEXT NOT NULL,
  service_detail TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  payment_option TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Políticas de Seguridad (RLS) - Permitir acceso anónimo temporalmente para desarrollo
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura anónima de cupones" ON public.coupons
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción anónima de cupones" ON public.coupons
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización anónima de cupones" ON public.coupons
  FOR UPDATE USING (true);
