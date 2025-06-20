-- Actualizar esquema para compras y proveedores

-- Agregar columna de estado a la tabla de compras
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled'));

-- Insertar datos de ejemplo para proveedores
INSERT INTO suppliers (name, contact_name, phone, email, address)
VALUES 
  ('Distribuidora Central S.A.S.', 'María González', '601-234-5678', 'ventas@distribuidoracentral.com', 'Calle 26 #68-35, Bogotá'),
  ('Carnes Premium Ltda.', 'Carlos Rodríguez', '300-987-6543', 'pedidos@carnespremium.com', 'Carrera 15 #45-20, Medellín'),
  ('Frutas y Verduras del Campo', 'Ana Martínez', '310-555-1234', 'info@frutasdelcampo.com', 'Avenida 19 #123-45, Cali'),
  ('Lácteos La Pradera', 'Luis Hernández', '320-444-7890', 'comercial@lacteoslapradera.com', 'Km 5 Vía Chía, Cundinamarca'),
  ('Bebidas y Licores El Dorado', 'Patricia Silva', '315-666-3210', 'ventas@bebidaseldorado.com', 'Zona Industrial, Barranquilla')
ON CONFLICT (name) DO NOTHING;

-- Función para actualizar cantidad de inventario
-- Primero, eliminamos la función existente para forzar la actualización de la caché del esquema
DROP FUNCTION IF EXISTS public.update_inventory_quantity(INTEGER, DECIMAL);

CREATE OR REPLACE FUNCTION update_inventory_quantity(p_item_id INTEGER, p_quantity_change DECIMAL)
RETURNS VOID AS $$
DECLARE
  item_exists BOOLEAN;
BEGIN
  -- Verificar si el item existe
  SELECT EXISTS (
    SELECT 1 FROM inventory_items WHERE id = p_item_id
  ) INTO item_exists;

  IF NOT item_exists THEN
    RAISE EXCEPTION 'Item with ID % not found', p_item_id;
  END IF;

  UPDATE inventory_items 
  SET 
    quantity = quantity + p_quantity_change,
    updated_at = NOW()
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update inventory for item %', p_item_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permisos de ejecución a los usuarios autenticados
GRANT EXECUTE ON FUNCTION public.update_inventory_quantity(INTEGER, DECIMAL) TO authenticated;

-- Insertar datos de ejemplo para compras
INSERT INTO purchases (supplier_id, user_id, purchase_date, total_amount, notes)
SELECT 
  s.id,
  (SELECT id FROM auth.users LIMIT 1),
  CURRENT_DATE - INTERVAL '1 day' * (RANDOM() * 30)::INT,
  (RANDOM() * 500000 + 50000)::DECIMAL(10,2),
  CASE 
    WHEN RANDOM() < 0.3 THEN 'Compra de emergencia'
    WHEN RANDOM() < 0.6 THEN 'Pedido regular mensual'
    ELSE NULL
  END
FROM suppliers s
WHERE NOT EXISTS (SELECT 1 FROM purchases WHERE supplier_id = s.id)
LIMIT 8;

-- Insertar items de compra de ejemplo
INSERT INTO purchase_items (purchase_id, inventory_item_id, quantity, unit_price, total_price)
SELECT 
  p.id,
  i.id,
  (RANDOM() * 20 + 5)::DECIMAL(10,2),
  i.cost_per_unit * (0.8 + RANDOM() * 0.4), -- Precio con variación del ±20%
  (RANDOM() * 20 + 5)::DECIMAL(10,2) * i.cost_per_unit * (0.8 + RANDOM() * 0.4)
FROM purchases p
CROSS JOIN inventory_items i
WHERE RANDOM() < 0.3 -- Solo algunos items por compra
AND NOT EXISTS (SELECT 1 FROM purchase_items WHERE purchase_id = p.id AND inventory_item_id = i.id)
LIMIT 25;

-- Crear políticas RLS para compras
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver compras"
  ON purchases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden crear compras"
  ON purchases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'cashier')
    )
  );

-- Crear políticas RLS para proveedores
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver proveedores"
  ON suppliers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden modificar proveedores"
  ON suppliers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'cashier')
    )
  );

-- Crear políticas RLS para items de compra
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver items de compra"
  ON purchase_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden crear items de compra"
  ON purchase_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'cashier')
    )
  );
