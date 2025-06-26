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