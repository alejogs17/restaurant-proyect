-- Script para verificar y crear tablas de inventario
-- Este script verifica qué tablas existen y crea las que faltan

-- 1. Verificar qué tablas existen
SELECT 'Tablas existentes:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('inventory', 'inventory_movements', 'inventory_items')
ORDER BY table_name;

-- 2. Crear tabla inventory si no existe
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) NOT NULL DEFAULT 'unidad',
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla inventory_movements si no existe
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER REFERENCES inventory(id),
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out')),
    quantity DECIMAL(10,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insertar datos de ejemplo en inventory si está vacía
INSERT INTO inventory (name, description, unit, quantity, min_quantity, cost_per_unit)
SELECT * FROM (VALUES 
    ('Tomates', 'Tomates frescos para ensaladas', 'kg', 50.0, 10.0, 2500.0),
    ('Lechuga', 'Lechuga fresca', 'unidad', 30.0, 5.0, 1500.0),
    ('Carne de Res', 'Carne de res premium', 'kg', 25.0, 8.0, 45000.0),
    ('Pollo', 'Pollo entero', 'kg', 40.0, 12.0, 18000.0),
    ('Arroz', 'Arroz blanco', 'kg', 100.0, 20.0, 3500.0),
    ('Aceite de Oliva', 'Aceite de oliva extra virgen', 'litro', 15.0, 3.0, 25000.0),
    ('Queso', 'Queso mozzarella', 'kg', 20.0, 5.0, 28000.0),
    ('Pan', 'Pan fresco', 'unidad', 100.0, 20.0, 800.0)
) AS v(name, description, unit, quantity, min_quantity, cost_per_unit)
WHERE NOT EXISTS (SELECT 1 FROM inventory LIMIT 1);

-- 5. Insertar algunos movimientos de ejemplo
INSERT INTO inventory_movements (inventory_item_id, movement_type, quantity, reason)
SELECT 
    i.id,
    CASE WHEN RANDOM() > 0.5 THEN 'in' ELSE 'out' END,
    (RANDOM() * 10 + 1)::DECIMAL(10,2),
    CASE 
        WHEN RANDOM() > 0.5 THEN 'Compra de proveedor'
        ELSE 'Uso en cocina'
    END
FROM inventory i
CROSS JOIN GENERATE_SERIES(1, 3) -- 3 movimientos por item
WHERE NOT EXISTS (SELECT 1 FROM inventory_movements LIMIT 1);

-- 6. Verificar los datos insertados
SELECT 'Datos en inventory:' as info;
SELECT COUNT(*) as total_items FROM inventory;

SELECT 'Datos en inventory_movements:' as info;
SELECT COUNT(*) as total_movements FROM inventory_movements;

-- 7. Mostrar resumen
SELECT 'Resumen de inventario:' as info;
SELECT 
    COUNT(*) as total_items,
    SUM(quantity * cost_per_unit) as total_value,
    COUNT(CASE WHEN quantity <= min_quantity THEN 1 END) as low_stock,
    COUNT(CASE WHEN quantity <= 0 THEN 1 END) as out_of_stock
FROM inventory; 