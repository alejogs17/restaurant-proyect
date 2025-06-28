-- Script para verificar y crear datos de prueba para ventas
-- Ejecutar este script en la base de datos de Supabase

-- 1. Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'payments', 'profiles');

-- 2. Verificar datos en las tablas
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as count FROM payments
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles;

-- 3. Verificar estructura de las tablas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- 4. Insertar datos de prueba si no existen

-- Insertar perfiles de prueba
INSERT INTO profiles (id, first_name, last_name, role, status)
SELECT 'test-user-1', 'Juan', 'Pérez', 'waiter', 'active'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'test-user-1');

INSERT INTO profiles (id, first_name, last_name, role, status)
SELECT 'test-user-2', 'María', 'García', 'waiter', 'active'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'test-user-2');

INSERT INTO profiles (id, first_name, last_name, role, status)
SELECT 'test-user-3', 'Carlos', 'López', 'waiter', 'active'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'test-user-3');

-- Insertar órdenes de prueba (últimos 30 días)
INSERT INTO orders (id, total, status, user_id, created_at)
SELECT 
  'test-order-' || i,
  25000 + (i * 5000),
  'completed',
  CASE (i % 3) 
    WHEN 0 THEN 'test-user-1'
    WHEN 1 THEN 'test-user-2'
    ELSE 'test-user-3'
  END,
  NOW() - INTERVAL '1 day' * (i % 30)
FROM generate_series(1, 50) i
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = 'test-order-' || i);

-- Insertar pagos de prueba
INSERT INTO payments (id, order_id, amount, payment_method, payment_date)
SELECT 
  'test-payment-' || i,
  'test-order-' || i,
  25000 + (i * 5000),
  CASE (i % 4)
    WHEN 0 THEN 'efectivo'
    WHEN 1 THEN 'tarjeta'
    WHEN 2 THEN 'transferencia'
    ELSE 'pse'
  END,
  NOW() - INTERVAL '1 day' * (i % 30)
FROM generate_series(1, 50) i
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = 'test-payment-' || i);

-- 5. Verificar datos insertados
SELECT 'Verificación final:' as test;

SELECT 'Órdenes por día:' as info;
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as ordenes,
  SUM(total) as total_ventas
FROM orders 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC
LIMIT 10;

SELECT 'Métodos de pago:' as info;
SELECT 
  payment_method,
  COUNT(*) as cantidad,
  SUM(amount) as total
FROM payments 
WHERE payment_date >= NOW() - INTERVAL '30 days'
GROUP BY payment_method;

SELECT 'Top meseros:' as info;
SELECT 
  p.first_name || ' ' || p.last_name as mesero,
  COUNT(o.id) as ordenes,
  SUM(o.total) as ventas_totales
FROM orders o
JOIN profiles p ON o.user_id = p.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
  AND o.status = 'completed'
GROUP BY p.id, p.first_name, p.last_name
ORDER BY ventas_totales DESC; 