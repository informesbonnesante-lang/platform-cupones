-- ================================================
-- ELIMINAR TABLA categorias_servicio de Supabase
-- Ejecuta este script en el SQL Editor de Supabase
-- ================================================

DROP TABLE IF EXISTS public.categorias_servicio;

-- Verificación: debería devolver un error de "no existe" o vacío
-- SELECT * FROM public.categorias_servicio; -- Ya no debería existir
SELECT 'Tabla categorias_servicio eliminada correctamente' AS resultado;
