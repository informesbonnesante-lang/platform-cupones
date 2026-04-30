-- ================================================
-- RESET TABLA COUPONS (categorias_servicio NO se toca)
-- Ejecuta este script en el SQL Editor de Supabase
-- ================================================

-- 1. Eliminar la tabla coupons si existe (con sus políticas RLS)
DROP TABLE IF EXISTS public.coupons;

-- 2. Crear la tabla coupons con todos los campos actuales del proyecto
CREATE TABLE public.coupons (
  id               UUID                     DEFAULT gen_random_uuid() PRIMARY KEY,
  code             TEXT                     NOT NULL UNIQUE,
  patient_ci       TEXT                     NOT NULL,
  telefono         TEXT                     NOT NULL,
  service_category TEXT                     NOT NULL,
  service_detail   TEXT                     NOT NULL,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by       TEXT                     NOT NULL,
  expiry_date      DATE                     NOT NULL,
  payment_option   TEXT                     NOT NULL,
  payment_status   TEXT                     NOT NULL,
  monto_pagado     NUMERIC,
  total_sessions   INTEGER                  DEFAULT 1,
  used_sessions    INTEGER                  DEFAULT 0,
  used_at          TIMESTAMP WITH TIME ZONE
);

-- 3. Activar Row Level Security (RLS)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas anteriores si existen (evita errores de duplicado)
DROP POLICY IF EXISTS "Permitir lectura en cupones"        ON public.coupons;
DROP POLICY IF EXISTS "Permitir insercion en cupones"      ON public.coupons;
DROP POLICY IF EXISTS "Permitir actualizacion en cupones"  ON public.coupons;
DROP POLICY IF EXISTS "Permitir eliminacion en cupones"    ON public.coupons;
DROP POLICY IF EXISTS "Permitir lectura anónima de cupones"   ON public.coupons;
DROP POLICY IF EXISTS "Permitir inserción anónima de cupones" ON public.coupons;
DROP POLICY IF EXISTS "Permitir actualización anónima de cupones" ON public.coupons;
DROP POLICY IF EXISTS "Permitir lectura y escritura en cupones" ON public.coupons;

-- 5. Crear políticas abiertas (acceso anónimo con anon key)
CREATE POLICY "Permitir lectura en cupones"
  ON public.coupons FOR SELECT USING (true);

CREATE POLICY "Permitir insercion en cupones"
  ON public.coupons FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualizacion en cupones"
  ON public.coupons FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permitir eliminacion en cupones"
  ON public.coupons FOR DELETE USING (true);

-- ================================================
-- VERIFICACION: Debería mostrar la tabla vacía creada
-- ================================================
SELECT * FROM public.coupons LIMIT 1;
