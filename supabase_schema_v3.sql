-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- Esto NO borrará tus datos actuales. Solo añadirá las columnas necesarias para el sistema de Paquetes de Sesiones.

ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS used_sessions INTEGER DEFAULT 0;

-- Actualizamos los cupones que ya fueron utilizados en versiones anteriores
UPDATE public.coupons
SET total_sessions = 1, used_sessions = 1
WHERE used_at IS NOT NULL AND used_sessions = 0;

-- Actualizamos los cupones válidos que aún no han sido usados
UPDATE public.coupons
SET total_sessions = 1, used_sessions = 0
WHERE used_at IS NULL AND total_sessions IS NULL;
