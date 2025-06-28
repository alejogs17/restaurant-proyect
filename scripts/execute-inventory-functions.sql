-- Script para ejecutar las funciones RPC del inventario
-- Ejecutar este script en la base de datos de Supabase

-- 1. Verificar que las funciones existen
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_inventory_stats', 'get_low_stock_items', 'get_out_of_stock_items');

-- 2. Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('inventory_items', 'inventory_movements');

-- 3. Verificar datos en inventory_items
SELECT COUNT(*) as total_items FROM inventory_items;

-- 4. Ejecutar las funciones para verificar que funcionan
SELECT * FROM get_inventory_stats();
SELECT * FROM get_low_stock_items();
SELECT * FROM get_out_of_stock_items();

-- 5. Si las funciones no existen, crearlas
-- Función para obtener estadísticas del inventario
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

-- Función para obtener ítems con stock bajo
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

-- Función para obtener ítems sin stock
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

-- 6. Verificar permisos RLS
-- Asegurar que las funciones son accesibles para usuarios autenticados
GRANT EXECUTE ON FUNCTION get_inventory_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_out_of_stock_items() TO authenticated;

-- 7. Insertar datos de prueba si no existen
INSERT INTO inventory_items (name, description, unit, quantity, min_quantity, cost_per_unit)
SELECT 'Harina de Trigo', 'Harina de trigo para panadería', 'kg', 50, 10, 2500
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Harina de Trigo');

INSERT INTO inventory_items (name, description, unit, quantity, min_quantity, cost_per_unit)
SELECT 'Aceite de Oliva', 'Aceite de oliva extra virgen', 'L', 20, 5, 15000
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Aceite de Oliva');

INSERT INTO inventory_items (name, description, unit, quantity, min_quantity, cost_per_unit)
SELECT 'Tomates', 'Tomates frescos', 'kg', 0, 15, 3000
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Tomates');

INSERT INTO inventory_items (name, description, unit, quantity, min_quantity, cost_per_unit)
SELECT 'Queso Mozzarella', 'Queso mozzarella para pizza', 'kg', 5, 8, 12000
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Queso Mozzarella');

-- 8. Verificar que todo funciona
SELECT 'Verificación final:' as test;
SELECT * FROM get_inventory_stats();
SELECT * FROM get_low_stock_items();
SELECT * FROM get_out_of_stock_items(); 