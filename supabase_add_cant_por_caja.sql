-- Ejecutar este script en el SQL Editor de Supabase
ALTER TABLE inventory_items 
ADD COLUMN cant_por_caja INT4 DEFAULT 1;

-- Opcional: Actualizar los registros existentes a 1 si el default no se aplicó automáticamente a filas pasadas
UPDATE inventory_items 
SET cant_por_caja = 1 
WHERE cant_por_caja IS NULL;
