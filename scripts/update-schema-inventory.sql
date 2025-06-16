-- Actualizar esquema para inventario y movimientos

-- Crear tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id SERIAL PRIMARY KEY,
  inventory_item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out')),
  quantity DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT, -- Para referenciar compras, ventas, etc.
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear función para registrar movimientos automáticamente
CREATE OR REPLACE FUNCTION log_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la cantidad cambió, registrar el movimiento
  IF OLD.quantity IS DISTINCT FROM NEW.quantity THEN
    INSERT INTO inventory_movements (
      inventory_item_id,
      movement_type,
      quantity,
      reason,
      user_id
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.quantity > OLD.quantity THEN 'in'
        ELSE 'out'
      END,
      ABS(NEW.quantity - OLD.quantity),
      'Ajuste manual',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para movimientos automáticos
CREATE TRIGGER inventory_movement_trigger
  AFTER UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION log_inventory_movement();

-- Actualizar datos de ejemplo con precios en pesos colombianos
UPDATE products SET price = price * 4000 WHERE price < 1000; -- Convertir a COP aproximadamente

-- Insertar datos de ejemplo para inventario
INSERT INTO inventory_items (name, description, unit, quantity, min_quantity, cost_per_unit)
VALUES 
  ('Arroz Blanco', 'Arroz blanco de primera calidad', 'kg', 50, 10, 3500),
  ('Aceite de Girasol', 'Aceite vegetal para cocinar', 'l', 20, 5, 8500),
  ('Pollo Entero', 'Pollo fresco de granja', 'kg', 30, 8, 12000),
  ('Carne de Res', 'Carne de res para hamburguesas', 'kg', 15, 5, 18000),
  ('Tomate', 'Tomate fresco para ensaladas', 'kg', 25, 5, 4500),
  ('Lechuga', 'Lechuga fresca', 'unidad', 40, 10, 2500),
  ('Pan para Hamburguesa', 'Pan artesanal para hamburguesas', 'unidad', 100, 20, 1500),
  ('Queso Mozzarella', 'Queso mozzarella para pizzas', 'kg', 8, 3, 15000),
  ('Cerveza Nacional', 'Cerveza nacional en botella', 'botella', 120, 24, 3200),
  ('Gaseosa Cola', 'Gaseosa cola 350ml', 'lata', 80, 20, 2800)
ON CONFLICT (name) DO NOTHING;

-- Crear políticas RLS para inventory_items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver inventario"
  ON inventory_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden modificar inventario"
  ON inventory_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'cashier')
    )
  );

-- Crear políticas RLS para inventory_movements
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver movimientos"
  ON inventory_movements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden crear movimientos"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'cashier')
    )
  );
