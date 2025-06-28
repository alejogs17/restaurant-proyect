-- Script para insertar datos de ejemplo en las tablas de compras
-- Este script crea proveedores, compras e items de compras para probar el reporte

-- 1. Insertar proveedores
INSERT INTO suppliers (name, contact_name, phone, email, address) VALUES
('Distribuidora de Alimentos S.A.', 'Carlos Mendoza', '300-123-4567', 'carlos@distribuidora.com', 'Calle 123 #45-67, Bogotá'),
('Carnes Premium Ltda.', 'María González', '310-987-6543', 'maria@carnespremium.com', 'Avenida 78 #90-12, Medellín'),
('Verduras Frescas SAS', 'Juan Pérez', '315-555-1234', 'juan@verdurasfrescas.com', 'Carrera 15 #23-45, Cali'),
('Lácteos del Valle', 'Ana Rodríguez', '320-777-8888', 'ana@lacteosdelvalle.com', 'Calle 89 #12-34, Pereira'),
('Especias y Condimentos', 'Luis Martínez', '300-444-5555', 'luis@especias.com', 'Avenida 56 #78-90, Bucaramanga')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar compras
INSERT INTO purchases (supplier_id, user_id, purchase_date, total_amount, notes, status) VALUES
(1, NULL, CURRENT_DATE - INTERVAL '5 days', 250000, 'Compra de productos básicos', 'completed'),
(2, NULL, CURRENT_DATE - INTERVAL '4 days', 180000, 'Compra de carnes premium', 'completed'),
(3, NULL, CURRENT_DATE - INTERVAL '3 days', 95000, 'Compra de verduras frescas', 'completed'),
(4, NULL, CURRENT_DATE - INTERVAL '2 days', 120000, 'Compra de lácteos', 'completed'),
(5, NULL, CURRENT_DATE - INTERVAL '1 day', 75000, 'Compra de especias', 'completed'),
(1, NULL, CURRENT_DATE, 300000, 'Compra semanal de productos', 'completed'),
(2, NULL, CURRENT_DATE, 220000, 'Compra de carnes para el fin de semana', 'completed'),
(3, NULL, CURRENT_DATE, 110000, 'Compra de verduras orgánicas', 'completed')
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar items de compras (asumiendo que tienes inventory_items con IDs 1-15)
INSERT INTO purchase_items (purchase_id, inventory_item_id, quantity, unit_price, total_price) VALUES
-- Compra 1 (Distribuidora de Alimentos)
(1, 1, 20.0, 2500.0, 50000.0),   -- Tomates
(1, 2, 15.0, 1500.0, 22500.0),   -- Lechuga
(1, 5, 50.0, 3500.0, 175000.0),  -- Arroz
(1, 7, 10.0, 25000.0, 250000.0), -- Aceite de Oliva

-- Compra 2 (Carnes Premium)
(2, 3, 8.0, 45000.0, 360000.0),  -- Carne de Res
(2, 4, 12.0, 18000.0, 216000.0), -- Pollo

-- Compra 3 (Verduras Frescas)
(3, 1, 30.0, 2500.0, 75000.0),   -- Tomates
(3, 2, 20.0, 1500.0, 30000.0),   -- Lechuga
(3, 9, 25.0, 1200.0, 30000.0),   -- Cebolla
(3, 10, 5.0, 8000.0, 40000.0),   -- Ajo

-- Compra 4 (Lácteos del Valle)
(4, 7, 8.0, 25000.0, 200000.0),  -- Aceite de Oliva
(4, 8, 15.0, 28000.0, 420000.0), -- Queso
(4, 13, 20.0, 12000.0, 240000.0), -- Huevos
(4, 14, 25.0, 3500.0, 87500.0),  -- Leche

-- Compra 5 (Especias y Condimentos)
(5, 10, 3.0, 8000.0, 24000.0),   -- Ajo
(5, 15, 8.0, 22000.0, 176000.0), -- Mantequilla

-- Compra 6 (Distribuidora de Alimentos - segunda compra)
(6, 1, 25.0, 2500.0, 62500.0),   -- Tomates
(6, 2, 18.0, 1500.0, 27000.0),   -- Lechuga
(6, 5, 60.0, 3500.0, 210000.0),  -- Arroz

-- Compra 7 (Carnes Premium - segunda compra)
(7, 3, 10.0, 45000.0, 450000.0), -- Carne de Res
(7, 4, 15.0, 18000.0, 270000.0), -- Pollo

-- Compra 8 (Verduras Frescas - segunda compra)
(8, 1, 35.0, 2500.0, 87500.0),   -- Tomates
(8, 2, 22.0, 1500.0, 33000.0),   -- Lechuga
(8, 11, 40.0, 2000.0, 80000.0),  -- Papa
(8, 12, 30.0, 1800.0, 54000.0)   -- Zanahoria
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar los datos insertados
SELECT 'Resumen de datos de compras:' as info;
SELECT 'Proveedores:' as table_name, COUNT(*) as count FROM suppliers
UNION ALL
SELECT 'Compras:' as table_name, COUNT(*) as count FROM purchases
UNION ALL
SELECT 'Items de compras:' as table_name, COUNT(*) as count FROM purchase_items;

-- 5. Mostrar resumen de compras
SELECT 'Resumen de compras:' as info;
SELECT 
    COUNT(*) as total_purchases,
    SUM(total_amount) as total_spent,
    AVG(total_amount) as average_purchase,
    MIN(total_amount) as min_purchase,
    MAX(total_amount) as max_purchase
FROM purchases 
WHERE status = 'completed';

-- 6. Mostrar top proveedores
SELECT 'Top proveedores por gasto:' as info;
SELECT 
    s.name as supplier_name,
    COUNT(p.id) as total_purchases,
    SUM(p.total_amount) as total_spent,
    AVG(p.total_amount) as average_purchase
FROM suppliers s
LEFT JOIN purchases p ON s.id = p.supplier_id
WHERE p.status = 'completed'
GROUP BY s.id, s.name
ORDER BY total_spent DESC
LIMIT 5; 