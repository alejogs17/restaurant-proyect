-- Script para verificar y corregir permisos RLS
-- Ejecutar este script en la base de datos de Supabase

-- 1. Verificar políticas RLS existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. Verificar si RLS está habilitado en las tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('orders', 'payments', 'profiles', 'inventory_items', 'inventory_movements');

-- 3. Crear políticas RLS básicas para permitir acceso a usuarios autenticados

-- Políticas para tabla orders
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON orders;
CREATE POLICY "Enable read access for authenticated users" ON orders
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON orders;
CREATE POLICY "Enable insert access for authenticated users" ON orders
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON orders;
CREATE POLICY "Enable update access for authenticated users" ON orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Políticas para tabla payments
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON payments;
CREATE POLICY "Enable read access for authenticated users" ON payments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON payments;
CREATE POLICY "Enable insert access for authenticated users" ON payments
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON payments;
CREATE POLICY "Enable update access for authenticated users" ON payments
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Políticas para tabla profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
CREATE POLICY "Enable read access for authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON profiles;
CREATE POLICY "Enable insert access for authenticated users" ON profiles
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON profiles;
CREATE POLICY "Enable update access for authenticated users" ON profiles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Políticas para tabla inventory_items
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_items;
CREATE POLICY "Enable read access for authenticated users" ON inventory_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON inventory_items;
CREATE POLICY "Enable insert access for authenticated users" ON inventory_items
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON inventory_items;
CREATE POLICY "Enable update access for authenticated users" ON inventory_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Políticas para tabla inventory_movements
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_movements;
CREATE POLICY "Enable read access for authenticated users" ON inventory_movements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON inventory_movements;
CREATE POLICY "Enable insert access for authenticated users" ON inventory_movements
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON inventory_movements;
CREATE POLICY "Enable update access for authenticated users" ON inventory_movements
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. Asegurar que RLS está habilitado en las tablas
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- 5. Verificar permisos de funciones RPC
GRANT EXECUTE ON FUNCTION get_inventory_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_out_of_stock_items() TO authenticated;

-- 6. Verificar que las tablas tienen los permisos correctos
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_movements TO authenticated;

-- 7. Verificar secuencias si existen
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Verificación final de políticas
SELECT 
  'Políticas RLS después de la corrección:' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('orders', 'payments', 'profiles', 'inventory_items', 'inventory_movements')
ORDER BY tablename, policyname; 