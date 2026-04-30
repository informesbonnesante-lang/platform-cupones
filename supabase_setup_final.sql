-- ================================================================
-- RESET COMPLETO DE SUPABASE - MedCupon
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ================================================================

-- 1. Eliminar tablas anteriores
DROP TABLE IF EXISTS public.coupons;
DROP TABLE IF EXISTS public.categorias_servicio;
DROP TABLE IF EXISTS public.usuarios;

-- 2. Crear tabla coupons
CREATE TABLE public.coupons (
  id               UUID                     DEFAULT gen_random_uuid() PRIMARY KEY,
  code             TEXT                     NOT NULL UNIQUE,
  patient_ci       TEXT                     NOT NULL,
  telefono         TEXT                     NOT NULL DEFAULT '',
  service_category TEXT                     NOT NULL DEFAULT '',
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

-- 3. Habilitar RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas abiertas (anon key tiene acceso completo)
CREATE POLICY "select_coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "insert_coupons" ON public.coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "update_coupons" ON public.coupons FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete_coupons" ON public.coupons FOR DELETE USING (true);

-- 5. Verificación
SELECT 'OK - Tabla coupons creada correctamente' AS resultado, COUNT(*) AS filas FROM public.coupons;
