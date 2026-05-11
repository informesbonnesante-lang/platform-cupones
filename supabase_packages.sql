-- ================================================
-- TABLAS Y COLUMNAS PARA SOPORTE DE PAQUETES
-- Ejecuta este script en el SQL Editor de Supabase
-- ================================================

-- 1. Crear tabla de Paquetes Maestros
CREATE TABLE IF NOT EXISTS public.packages (
  id          UUID                     DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT                     NOT NULL UNIQUE,
  items       JSONB                    NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS en packages (Permitir todo temporalmente)
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura en packages"       ON public.packages;
DROP POLICY IF EXISTS "Permitir insercion en packages"     ON public.packages;
DROP POLICY IF EXISTS "Permitir actualizacion en packages" ON public.packages;
DROP POLICY IF EXISTS "Permitir eliminacion en packages"   ON public.packages;

CREATE POLICY "Permitir lectura en packages"       ON public.packages FOR SELECT USING (true);
CREATE POLICY "Permitir insercion en packages"     ON public.packages FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion en packages" ON public.packages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir eliminacion en packages"   ON public.packages FOR DELETE USING (true);

-- 3. Añadir columnas a tabla coupons
-- Si usas Supabase, la sentencia ADD COLUMN IF NOT EXISTS a veces da warning si no existe la extensión,
-- pero en Postgres 13+ es válido.

ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS package_group_id UUID NULL,
ADD COLUMN IF NOT EXISTS package_name TEXT NULL;

-- 4. VERIFICACION
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'packages';
