-- Script para insertar datos de prueba para órdenes y pagos

-- Insertar órdenes de prueba (sin user_id para evitar problemas con UUIDs)
INSERT INTO orders (order_number, table_id, status, order_type, customer_name, customer_phone, subtotal, tax, discount, total, notes)
VALUES 
  ('ORD-001', 1, 'completed', 'dine_in', 'Juan Pérez', '3001234567', 25000, 4750, 0, 29750, 'Cliente frecuente'),
  ('ORD-002', 2, 'completed', 'dine_in', 'María García', '3109876543', 18000, 3420, 2000, 19420, 'Con descuento'),
  ('ORD-003', 3, 'completed', 'takeout', 'Carlos López', '3205551234', 32000, 6080, 0, 38080, 'Para llevar'),
  ('ORD-004', 4, 'delivered', 'dine_in', 'Ana Rodríguez', '3154447890', 15000, 2850, 0, 17850, 'Mesa 4'),
  ('ORD-005', 5, 'completed', 'dine_in', 'Luis Martínez', '3256663210', 42000, 7980, 5000, 44980, 'Grupo grande'),
  ('ORD-006', 6, 'completed', 'delivery', 'Patricia Silva', '3307778888', 28000, 5320, 0, 33320, 'Domicilio'),
  ('ORD-007', 7, 'completed', 'dine_in', 'Roberto Díaz', '3358889999', 19000, 3610, 1500, 21110, 'Cliente VIP'),
  ('ORD-008', 8, 'completed', 'takeout', 'Carmen Vega', '3409990000', 22000, 4180, 0, 26180, 'Para llevar'),
  ('ORD-009', 9, 'completed', 'dine_in', 'Fernando Ruiz', '3450001111', 35000, 6650, 3000, 38650, 'Celebración'),
  ('ORD-010', 10, 'completed', 'dine_in', 'Isabel Torres', '3501112222', 26000, 4940, 0, 30940, 'Cena romántica')
ON CONFLICT (order_number) DO NOTHING;

-- Insertar pagos de prueba (sin user_id para evitar problemas con UUIDs)
INSERT INTO payments (order_id, payment_method, amount, reference_number, notes, payment_date)
VALUES 
  (1, 'cash', 29750, NULL, 'Pago en efectivo', NOW() - INTERVAL '2 hours'),
  (2, 'credit_card', 19420, 'REF-001234', 'Pago con tarjeta', NOW() - INTERVAL '3 hours'),
  (3, 'debit_card', 38080, 'REF-002345', 'Pago con débito', NOW() - INTERVAL '4 hours'),
  (4, 'mobile_payment', 17850, 'REF-003456', 'Pago móvil', NOW() - INTERVAL '5 hours'),
  (5, 'cash', 44980, NULL, 'Pago en efectivo', NOW() - INTERVAL '6 hours'),
  (6, 'bank_transfer', 33320, 'REF-004567', 'Transferencia bancaria', NOW() - INTERVAL '7 hours'),
  (7, 'credit_card', 21110, 'REF-005678', 'Pago con tarjeta', NOW() - INTERVAL '8 hours'),
  (8, 'cash', 26180, NULL, 'Pago en efectivo', NOW() - INTERVAL '9 hours'),
  (9, 'debit_card', 38650, 'REF-006789', 'Pago con débito', NOW() - INTERVAL '10 hours'),
  (10, 'mobile_payment', 30940, 'REF-007890', 'Pago móvil', NOW() - INTERVAL '11 hours')
ON CONFLICT DO NOTHING;

-- Insertar algunos pagos de hoy para que aparezcan en las estadísticas
INSERT INTO payments (order_id, payment_method, amount, reference_number, notes, payment_date)
VALUES 
  (1, 'cash', 15000, NULL, 'Pago parcial de hoy', NOW()),
  (2, 'credit_card', 25000, 'REF-TODAY-001', 'Pago de hoy', NOW()),
  (3, 'mobile_payment', 18000, 'REF-TODAY-002', 'Pago móvil de hoy', NOW())
ON CONFLICT DO NOTHING;

-- Verificar que los datos se insertaron correctamente
SELECT 
  'Órdenes creadas:' as info,
  COUNT(*) as count 
FROM orders 
WHERE order_number LIKE 'ORD-%';

SELECT 
  'Pagos creados:' as info,
  COUNT(*) as count 
FROM payments;

SELECT 
  'Pagos de hoy:' as info,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM payments 
WHERE DATE(payment_date) = CURRENT_DATE; 