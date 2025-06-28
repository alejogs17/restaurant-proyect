-- Script para insertar datos de ejemplo en todas las tablas principales
-- Este script crea datos realistas para probar los reportes

-- 1. Insertar categorías de productos
INSERT INTO categories (name, description) VALUES
('Platos Principales', 'Platos fuertes del menú'),
('Entradas', 'Aperitivos y entradas'),
('Bebidas', 'Bebidas y refrescos'),
('Postres', 'Dulces y postres'),
('Especialidades', 'Platos especiales del chef')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar productos
INSERT INTO products (name, description, price, category_id, active) VALUES
('Pasta Carbonara', 'Pasta con salsa cremosa, panceta y parmesano', 25000, 1, true),
('Ensalada César', 'Lechuga romana, crutones, parmesano y aderezo César', 18000, 2, true),
('Sopa de Tomate', 'Sopa cremosa de tomates asados', 15000, 2, true),
('Pollo a la Plancha', 'Pechuga de pollo a la plancha con vegetales', 28000, 1, true),
('Lomo Saltado', 'Plato peruano con carne, arroz y papas fritas', 32000, 1, true),
('Tiramisú', 'Postre italiano con café y mascarpone', 12000, 4, true),
('Café Americano', 'Café negro americano', 5000, 3, true),
('Limonada Natural', 'Limonada fresca natural', 8000, 3, true),
('Tarta de Chocolate', 'Tarta de chocolate con frutos rojos', 14000, 4, true),
('Paella Valenciana', 'Arroz con mariscos y pollo', 45000, 5, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar mesas
INSERT INTO tables (name, capacity, status) VALUES
('Mesa 1', 4, 'available'),
('Mesa 2', 4, 'available'),
('Mesa 3', 6, 'available'),
('Mesa 4', 2, 'available'),
('Mesa 5', 8, 'available'),
('Mesa 6', 4, 'available'),
('Mesa 7', 6, 'available'),
('Mesa 8', 4, 'available')
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar órdenes de ejemplo
INSERT INTO orders (order_number, table_id, user_id, status, order_type, customer_name, subtotal, tax, discount, total) VALUES
('ORD-001', 1, NULL, 'completed', 'dine_in', 'Juan Pérez', 43000, 8170, 0, 51170),
('ORD-002', 3, NULL, 'completed', 'dine_in', 'María García', 68000, 12920, 5000, 75920),
('ORD-003', 2, NULL, 'completed', 'dine_in', 'Carlos López', 32000, 6080, 0, 38080),
('ORD-004', 5, NULL, 'completed', 'dine_in', 'Ana Rodríguez', 89000, 16910, 0, 105910),
('ORD-005', 4, NULL, 'completed', 'takeout', 'Luis Martínez', 25000, 4750, 0, 29750),
('ORD-006', 6, NULL, 'completed', 'dine_in', 'Carmen Silva', 56000, 10640, 0, 66640),
('ORD-007', 7, NULL, 'completed', 'dine_in', 'Roberto Díaz', 72000, 13680, 3000, 82680),
('ORD-008', 8, NULL, 'completed', 'delivery', 'Patricia Ruiz', 38000, 7220, 0, 45220)
ON CONFLICT (id) DO NOTHING;

-- 5. Insertar items de las órdenes
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, status) VALUES
(1, 1, 1, 25000, 25000, 'delivered'),
(1, 2, 1, 18000, 18000, 'delivered'),
(2, 4, 2, 28000, 56000, 'delivered'),
(2, 7, 1, 5000, 5000, 'delivered'),
(2, 8, 1, 8000, 8000, 'delivered'),
(3, 3, 1, 15000, 15000, 'delivered'),
(3, 5, 1, 32000, 32000, 'delivered'),
(4, 10, 1, 45000, 45000, 'delivered'),
(4, 6, 1, 12000, 12000, 'delivered'),
(4, 9, 1, 14000, 14000, 'delivered'),
(4, 7, 2, 5000, 10000, 'delivered'),
(4, 8, 1, 8000, 8000, 'delivered'),
(5, 1, 1, 25000, 25000, 'delivered'),
(6, 4, 1, 28000, 28000, 'delivered'),
(6, 2, 1, 18000, 18000, 'delivered'),
(6, 7, 1, 5000, 5000, 'delivered'),
(7, 5, 1, 32000, 32000, 'delivered'),
(7, 10, 1, 45000, 45000, 'delivered'),
(8, 3, 1, 15000, 15000, 'delivered'),
(8, 6, 1, 12000, 12000, 'delivered'),
(8, 8, 1, 8000, 8000, 'delivered'),
(8, 9, 1, 14000, 14000, 'delivered')
ON CONFLICT (id) DO NOTHING;

-- 6. Insertar pagos
INSERT INTO payments (order_id, payment_method, amount, reference_number, notes) VALUES
(1, 'cash', 51170, 'CASH-001', 'Pago en efectivo'),
(2, 'credit_card', 75920, 'CC-001', 'Pago con tarjeta de crédito'),
(3, 'debit_card', 38080, 'DC-001', 'Pago con tarjeta de débito'),
(4, 'cash', 105910, 'CASH-002', 'Pago en efectivo'),
(5, 'mobile_payment', 29750, 'MP-001', 'Pago con aplicación móvil'),
(6, 'credit_card', 66640, 'CC-002', 'Pago con tarjeta de crédito'),
(7, 'bank_transfer', 82680, 'BT-001', 'Transferencia bancaria'),
(8, 'cash', 45220, 'CASH-003', 'Pago en efectivo')
ON CONFLICT (id) DO NOTHING;

-- 7. Insertar facturas
INSERT INTO invoices (invoice_number, order_id, customer_name, customer_email, subtotal, tax, discount, total, status, due_date) VALUES
('FAC-001', 1, 'Juan Pérez', 'juan@email.com', 43000, 8170, 0, 51170, 'paid', CURRENT_DATE),
('FAC-002', 2, 'María García', 'maria@email.com', 68000, 12920, 5000, 75920, 'paid', CURRENT_DATE),
('FAC-003', 3, 'Carlos López', 'carlos@email.com', 32000, 6080, 0, 38080, 'paid', CURRENT_DATE),
('FAC-004', 4, 'Ana Rodríguez', 'ana@email.com', 89000, 16910, 0, 105910, 'paid', CURRENT_DATE),
('FAC-005', 5, 'Luis Martínez', 'luis@email.com', 25000, 4750, 0, 29750, 'paid', CURRENT_DATE),
('FAC-006', 6, 'Carmen Silva', 'carmen@email.com', 56000, 10640, 0, 66640, 'paid', CURRENT_DATE),
('FAC-007', 7, 'Roberto Díaz', 'roberto@email.com', 72000, 13680, 3000, 82680, 'paid', CURRENT_DATE),
('FAC-008', 8, 'Patricia Ruiz', 'patricia@email.com', 38000, 7220, 0, 45220, 'paid', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- 8. Verificar los datos insertados
SELECT 'Resumen de datos insertados:' as info;
SELECT 'Categorías:' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Productos:' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'Mesas:' as table_name, COUNT(*) as count FROM tables
UNION ALL
SELECT 'Órdenes:' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'Items de órdenes:' as table_name, COUNT(*) as count FROM order_items
UNION ALL
SELECT 'Pagos:' as table_name, COUNT(*) as count FROM payments
UNION ALL
SELECT 'Facturas:' as table_name, COUNT(*) as count FROM invoices;

-- 9. Mostrar resumen de ventas
SELECT 'Resumen de ventas:' as info;
SELECT 
    COUNT(*) as total_orders,
    SUM(total) as total_sales,
    AVG(total) as average_order_value,
    MIN(total) as min_order,
    MAX(total) as max_order
FROM orders 
WHERE status = 'completed'; 