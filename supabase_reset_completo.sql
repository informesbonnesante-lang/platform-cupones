-- ================================================
-- RESET COMPLETO DE TODAS LAS TABLAS
-- Ejecuta este script en el SQL Editor de Supabase
-- ⚠️ BORRARÁ TODOS LOS DATOS EXISTENTES ⚠️
-- ================================================

-- 1. ELIMINAR TABLAS EXISTENTES
DROP TABLE IF EXISTS public.coupons;
DROP TABLE IF EXISTS public.categorias_servicio;

-- ================================================
-- 2. CREAR TABLA: coupons (SCHEMA COMPLETO v4)
-- Incluye: ui_number, patient_name y todos los campos
-- ================================================
CREATE TABLE public.coupons (
  id               UUID                     DEFAULT gen_random_uuid() PRIMARY KEY,
  ui_number        TEXT                     UNIQUE,
  code             TEXT                     NOT NULL UNIQUE,
  patient_name     TEXT                     NOT NULL DEFAULT '',
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

-- ================================================
-- 3. RLS: Permitir todo con anon key
-- ================================================
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
-- 4. VERIFICACION FINAL
-- ================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coupons'
ORDER BY ordinal_position;
