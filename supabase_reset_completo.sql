-- ================================================
-- RESET COMPLETO DE TODAS LAS TABLAS
-- Ejecuta este script en el SQL Editor de Supabase
-- ⚠️ BORRARÁ TODOS LOS DATOS EXISTENTES ⚠️
-- ================================================

-- 1. ELIMINAR TABLAS EXISTENTES
DROP TABLE IF EXISTS public.coupons;
DROP TABLE IF EXISTS public.categorias_servicio;

-- ================================================
-- 2. CREAR TABLA: categorias_servicio
-- ================================================
CREATE TABLE public.categorias_servicio (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar categorías de ejemplo
INSERT INTO public.categorias_servicio (name) VALUES
  ('Consulta General'),
  ('Laboratorio'),
  ('Imágenes'),
  ('Kinesiología'),
  ('Especialidad');

-- RLS
ALTER TABLE public.categorias_servicio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo en categorias" ON public.categorias_servicio;
CREATE POLICY "Permitir todo en categorias"
  ON public.categorias_servicio FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- 3. CREAR TABLA: coupons
-- ================================================
CREATE TABLE public.coupons (
  id               UUID                     DEFAULT gen_random_uuid() PRIMARY KEY,
  code             TEXT                     NOT NULL UNIQUE,
  patient_ci       TEXT                     NOT NULL,
  telefono         TEXT                     NOT NULL DEFAULT '',
  service_category TEXT                     NOT NULL,
  service_detail   TEXT                     NOT NULL,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by       TEXT                     NOT NULL DEFAULT 'Administrador',
  expiry_date      DATE                     NOT NULL,
  payment_option   TEXT                     NOT NULL DEFAULT 'Efectivo',
  payment_status   TEXT                     NOT NULL DEFAULT 'Total',
  monto_pagado     NUMERIC,
  total_sessions   INTEGER                  NOT NULL DEFAULT 1,
  used_sessions    INTEGER                  NOT NULL DEFAULT 0,
  used_at          TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura en cupones"       ON public.coupons;
DROP POLICY IF EXISTS "Permitir insercion en cupones"     ON public.coupons;
DROP POLICY IF EXISTS "Permitir actualizacion en cupones" ON public.coupons;
DROP POLICY IF EXISTS "Permitir eliminacion en cupones"   ON public.coupons;

CREATE POLICY "Permitir lectura en cupones"
  ON public.coupons FOR SELECT USING (true);

CREATE POLICY "Permitir insercion en cupones"
  ON public.coupons FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualizacion en cupones"
  ON public.coupons FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permitir eliminacion en cupones"
  ON public.coupons FOR DELETE USING (true);

-- ================================================
-- 4. VERIFICACIÓN FINAL
-- ================================================
SELECT 'categorias_servicio' AS tabla, COUNT(*) AS registros FROM public.categorias_servicio
UNION ALL
SELECT 'coupons' AS tabla, COUNT(*) AS registros FROM public.coupons;
