-- Script simple para desactivar RLS temporalmente
-- Esto permitirá acceso a los datos sin problemas de permisos

-- 1. Desactivar RLS en todas las tablas principales
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- 2. Verificar que las tablas existen y tienen datos
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'order_items' as table_name, COUNT(*) as count FROM order_items
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as count FROM payments
UNION ALL
SELECT 'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'tables' as table_name, COUNT(*) as count FROM tables
UNION ALL
SELECT 'inventory' as table_name, COUNT(*) as count FROM inventory
UNION ALL
SELECT 'inventory_movements' as table_name, COUNT(*) as count FROM inventory_movements
UNION ALL
SELECT 'purchases' as table_name, COUNT(*) as count FROM purchases
UNION ALL
SELECT 'purchase_items' as table_name, COUNT(*) as count FROM purchase_items
UNION ALL
SELECT 'suppliers' as table_name, COUNT(*) as count FROM suppliers;

-- 3. Mostrar mensaje de confirmación
SELECT 'RLS desactivado en todas las tablas principales' as status; 