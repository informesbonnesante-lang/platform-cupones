-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- IMPORTANTE: Esto borrará los datos existentes para aplicar la nueva estructura limpia.

DROP TABLE IF EXISTS public.coupons;
DROP TABLE IF EXISTS public.categorias_servicio;
DROP TABLE IF EXISTS public.usuarios;

-- 1. Tabla de Usuarios
CREATE TABLE public.usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL, -- 'admin' o 'receptionist'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.usuarios (username, password, role) VALUES 
('admin', 'admin123', 'admin'),
('recepcion', 'recepcion123', 'receptionist');

-- 2. Tabla de Categorías de Servicio
CREATE TABLE public.categorias_servicio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO public.categorias_servicio (name) VALUES 
('Consulta General'),
('Laboratorio'),
('Imágenes'),
('Especialidad');

-- 3. Tabla de Cupones Actualizada
CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  patient_ci TEXT NOT NULL,
  telefono TEXT NOT NULL, -- NUEVO CAMPO
  service_category TEXT NOT NULL,
  service_detail TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  payment_option TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  monto_pagado NUMERIC, -- NUEVO CAMPO
  used_at TIMESTAMP WITH TIME ZONE
);

-- Políticas de Seguridad (RLS) - Permitir acceso anónimo temporalmente para desarrollo
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura y escritura en usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura en categorias" ON public.categorias_servicio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura en cupones" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
