-- Actualizar esquema para compras y proveedores

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
CREATE OR REPLACE FUNCTION update_inventory_quantity(item_id INTEGER, quantity_change DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory_items 
  SET 
    quantity = quantity + quantity_change,
    updated_at = NOW()
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

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
