-- Script FINAL para resolver problemas de permisos RLS
-- Ejecutar este script COMPLETO en la base de datos de Supabase

-- ===========================================
-- 1. VERIFICAR ESTADO ACTUAL
-- ===========================================

-- Verificar qué tablas existen
SELECT 'TABLAS EXISTENTES:' as info;
SELECT table_name, rowsecurity 
FROM pg_tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'payments', 'profiles', 'inventory_items', 'inventory_movements')
ORDER BY table_name;

-- Verificar políticas RLS existentes
SELECT 'POLÍTICAS RLS EXISTENTES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('orders', 'payments', 'profiles', 'inventory_items', 'inventory_movements')
ORDER BY tablename, policyname;

-- ===========================================
-- 2. ELIMINAR TODAS LAS POLÍTICAS RLS
-- ===========================================

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON orders;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON payments;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON profiles;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_items;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON inventory_items;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON inventory_items;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON inventory_items;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_movements;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON inventory_movements;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON inventory_movements;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON inventory_movements;

-- ===========================================
-- 3. DESHABILITAR RLS TEMPORALMENTE
-- ===========================================

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements DISABLE ROW LEVEL SECURITY;

-- ===========================================
-- 4. OTORGAR PERMISOS COMPLETOS
-- ===========================================

-- Permisos para tablas
GRANT ALL PRIVILEGES ON orders TO authenticated;
GRANT ALL PRIVILEGES ON payments TO authenticated;
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT ALL PRIVILEGES ON inventory_items TO authenticated;
GRANT ALL PRIVILEGES ON inventory_movements TO authenticated;

-- Permisos para secuencias (si existen)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===========================================
-- 5. CREAR FUNCIONES RPC SI NO EXISTEN
-- ===========================================

-- Función para estadísticas de inventario
CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS TABLE (
  total_items BIGINT,
  low_stock_count BIGINT,
  out_of_stock_count BIGINT,
  total_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN quantity <= min_quantity AND quantity > 0 THEN 1 END) as low_stock_count,
    COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_count,
    COALESCE(SUM(quantity * cost_per_unit), 0) as total_value
  FROM inventory_items;
END;
$$ LANGUAGE plpgsql;

-- Función para items con stock bajo
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
  id INT,
  name TEXT,
  description TEXT,
  unit TEXT,
  quantity DECIMAL,
  min_quantity DECIMAL,
  cost_per_unit DECIMAL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM inventory_items
  WHERE quantity <= min_quantity AND quantity > 0;
END;
$$ LANGUAGE plpgsql;

-- Función para items sin stock
CREATE OR REPLACE FUNCTION get_out_of_stock_items()
RETURNS TABLE (
  id INT,
  name TEXT,
  description TEXT,
  unit TEXT,
  quantity DECIMAL,
  min_quantity DECIMAL,
  cost_per_unit DECIMAL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM inventory_items
  WHERE quantity = 0;
END;
$$ LANGUAGE plpgsql;

-- Otorgar permisos para funciones RPC
GRANT EXECUTE ON FUNCTION get_inventory_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_out_of_stock_items() TO authenticated;

-- ===========================================
-- 6. INSERTAR DATOS DE PRUEBA
-- ===========================================

-- Insertar perfiles de prueba
INSERT INTO profiles (id, first_name, last_name, role, status)
SELECT 'test-user-1', 'Juan', 'Pérez', 'waiter', 'active'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'test-user-1');

INSERT INTO profiles (id, first_name, last_name, role, status)
SELECT 'test-user-2', 'María', 'García', 'waiter', 'active'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'test-user-2');

-- Insertar órdenes de prueba
INSERT INTO orders (id, total, status, user_id, created_at)
SELECT 'test-order-1', 25000, 'completed', 'test-user-1', NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = 'test-order-1');

INSERT INTO orders (id, total, status, user_id, created_at)
SELECT 'test-order-2', 35000, 'completed', 'test-user-2', NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = 'test-order-2');

-- Insertar pagos de prueba
INSERT INTO payments (id, order_id, amount, payment_method, payment_date)
SELECT 'test-payment-1', 'test-order-1', 25000, 'efectivo', NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = 'test-payment-1');

INSERT INTO payments (id, order_id, amount, payment_method, payment_date)
SELECT 'test-payment-2', 'test-order-2', 35000, 'tarjeta', NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = 'test-payment-2');

-- Insertar items de inventario de prueba
INSERT INTO inventory_items (name, description, unit, quantity, min_quantity, cost_per_unit)
SELECT 'Harina de Trigo', 'Harina de trigo para panadería', 'kg', 50, 10, 2500
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Harina de Trigo');

INSERT INTO inventory_items (name, description, unit, quantity, min_quantity, cost_per_unit)
SELECT 'Aceite de Oliva', 'Aceite de oliva extra virgen', 'L', 20, 5, 15000
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Aceite de Oliva');

INSERT INTO inventory_items (name, description, unit, quantity, min_quantity, cost_per_unit)
SELECT 'Tomates', 'Tomates frescos', 'kg', 0, 15, 3000
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Tomates');

-- ===========================================
-- 7. VERIFICACIÓN FINAL
-- ===========================================

SELECT 'VERIFICACIÓN FINAL - ESTADO DE TABLAS:' as info;
SELECT table_name, rowsecurity 
FROM pg_tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'payments', 'profiles', 'inventory_items', 'inventory_movements')
ORDER BY table_name;

SELECT 'VERIFICACIÓN FINAL - DATOS EN TABLAS:' as info;
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as count FROM payments
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'inventory_items' as table_name, COUNT(*) as count FROM inventory_items;

SELECT 'VERIFICACIÓN FINAL - FUNCIONES RPC:' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_inventory_stats', 'get_low_stock_items', 'get_out_of_stock_items');

SELECT '¡SCRIPT COMPLETADO EXITOSAMENTE!' as status; 