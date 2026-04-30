-- ================================================================
-- ACTUALIZAR TABLA coupons - Agregar nuevos campos
-- Ejecutar en: Supabase → SQL Editor → Run
-- ================================================================

-- Agregar campo: número de servicio único (UI)
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS ui_number TEXT UNIQUE;

-- Agregar campo: nombre del paciente
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT '';

-- Verificación
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coupons'
ORDER BY ordinal_position;
