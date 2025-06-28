-- Script rápido para corregir permisos RLS
-- Ejecutar este script en la base de datos de Supabase

-- 1. Deshabilitar RLS temporalmente para testing
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements DISABLE ROW LEVEL SECURITY;

-- 2. Otorgar permisos completos a usuarios autenticados
GRANT ALL ON orders TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON inventory_items TO authenticated;
GRANT ALL ON inventory_movements TO authenticated;

-- 3. Otorgar permisos para funciones RPC
GRANT EXECUTE ON FUNCTION get_inventory_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_out_of_stock_items() TO authenticated;

-- 4. Verificar que las funciones existen, si no, crearlas
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

-- 5. Insertar datos de prueba básicos si las tablas están vacías
INSERT INTO profiles (id, first_name, last_name, role, status)
SELECT 'test-user-1', 'Juan', 'Pérez', 'waiter', 'active'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'test-user-1');

INSERT INTO orders (id, total, status, user_id, created_at)
SELECT 'test-order-1', 25000, 'completed', 'test-user-1', NOW()
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = 'test-order-1');

INSERT INTO payments (id, order_id, amount, payment_method, payment_date)
SELECT 'test-payment-1', 'test-order-1', 25000, 'efectivo', NOW()
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = 'test-payment-1');

INSERT INTO inventory_items (name, description, unit, quantity, min_quantity, cost_per_unit)
SELECT 'Harina de Trigo', 'Harina de trigo para panadería', 'kg', 50, 10, 2500
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Harina de Trigo');

-- 6. Verificación final
SELECT 'Verificación de permisos:' as info;
SELECT table_name, rowsecurity FROM pg_tables WHERE table_schema = 'public' AND table_name IN ('orders', 'payments', 'profiles', 'inventory_items', 'inventory_movements');

SELECT 'Verificación de datos:' as info;
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as count FROM payments
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'inventory_items' as table_name, COUNT(*) as count FROM inventory_items; 