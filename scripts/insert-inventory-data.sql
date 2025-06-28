-- Script para insertar datos de ejemplo en inventory_items
-- Este script inserta productos de ejemplo para probar el reporte de inventario

-- Insertar datos de ejemplo en inventory_items si está vacía
INSERT INTO inventory_items (name, description, unit, quantity, min_quantity, cost_per_unit)
SELECT * FROM (VALUES 
    ('Tomates', 'Tomates frescos para ensaladas', 'kg', 50.0, 10.0, 2500.0),
    ('Lechuga', 'Lechuga fresca', 'unidad', 30.0, 5.0, 1500.0),
    ('Carne de Res', 'Carne de res premium', 'kg', 25.0, 8.0, 45000.0),
    ('Pollo', 'Pollo entero', 'kg', 40.0, 12.0, 18000.0),
    ('Arroz', 'Arroz blanco', 'kg', 100.0, 20.0, 3500.0),
    ('Aceite de Oliva', 'Aceite de oliva extra virgen', 'litro', 15.0, 3.0, 25000.0),
    ('Queso', 'Queso mozzarella', 'kg', 20.0, 5.0, 28000.0),
    ('Pan', 'Pan fresco', 'unidad', 100.0, 20.0, 800.0),
    ('Cebolla', 'Cebolla blanca', 'kg', 35.0, 8.0, 1200.0),
    ('Ajo', 'Ajo fresco', 'kg', 10.0, 2.0, 8000.0),
    ('Papa', 'Papa criolla', 'kg', 80.0, 15.0, 2000.0),
    ('Zanahoria', 'Zanahoria fresca', 'kg', 25.0, 5.0, 1800.0),
    ('Huevos', 'Huevos frescos', 'docena', 50.0, 10.0, 12000.0),
    ('Leche', 'Leche entera', 'litro', 40.0, 8.0, 3500.0),
    ('Mantequilla', 'Mantequilla sin sal', 'kg', 15.0, 3.0, 22000.0)
) AS v(name, description, unit, quantity, min_quantity, cost_per_unit)
WHERE NOT EXISTS (SELECT 1 FROM inventory_items LIMIT 1);

-- Crear tabla inventory_movements si no existe
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER REFERENCES inventory_items(id),
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out')),
    quantity DECIMAL(10,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar algunos movimientos de ejemplo
INSERT INTO inventory_movements (inventory_item_id, movement_type, quantity, reason)
SELECT 
    i.id,
    CASE WHEN RANDOM() > 0.5 THEN 'in' ELSE 'out' END,
    (RANDOM() * 10 + 1)::DECIMAL(10,2),
    CASE 
        WHEN RANDOM() > 0.5 THEN 'Compra de proveedor'
        ELSE 'Uso en cocina'
    END
FROM inventory_items i
CROSS JOIN GENERATE_SERIES(1, 3) -- 3 movimientos por item
WHERE NOT EXISTS (SELECT 1 FROM inventory_movements LIMIT 1);

-- Verificar los datos insertados
SELECT 'Datos en inventory_items:' as info;
SELECT COUNT(*) as total_items FROM inventory_items;

SELECT 'Datos en inventory_movements:' as info;
SELECT COUNT(*) as total_movements FROM inventory_movements;

-- Mostrar resumen del inventario
SELECT 'Resumen de inventario:' as info;
SELECT 
    COUNT(*) as total_items,
    SUM(quantity * cost_per_unit) as total_value,
    COUNT(CASE WHEN quantity <= min_quantity THEN 1 END) as low_stock,
    COUNT(CASE WHEN quantity <= 0 THEN 1 END) as out_of_stock
FROM inventory_items;

-- Mostrar algunos items de ejemplo
SELECT 'Items de ejemplo:' as info;
SELECT name, quantity, unit, cost_per_unit, (quantity * cost_per_unit) as total_value
FROM inventory_items
ORDER BY (quantity * cost_per_unit) DESC
LIMIT 5; 