-- Script para migrar los datos antiguos de 'item_catalogo' a la nueva tabla 'inventory_items'
-- Esto asegura que no se pierda ningún producto y que sean compatibles con el nuevo sistema de Cajas y Depósitos.

INSERT INTO inventory_items (
    nombre, 
    categoria, 
    unidad, 
    area, 
    stock_inicial, 
    current_stock, 
    stock_minimo, 
    vencimiento, 
    cant_por_caja
)
SELECT 
    nombre_item as nombre, 
    categoria, 
    COALESCE(unidad, 'UNIDAD') as unidad, 
    'DEPÓSITO CENTRAL' as area, -- Asignamos todos al depósito central por defecto
    COALESCE(stock_inicial, 0) as stock_inicial, 
    COALESCE(current_stock, 0) as current_stock, 
    COALESCE(stock_minimo, 5) as stock_minimo, 
    '2099-12-31' as vencimiento, 
    1 as cant_por_caja -- Por defecto 1 unidad por caja
FROM item_catalogo
WHERE nombre_item NOT IN (SELECT nombre FROM inventory_items);
