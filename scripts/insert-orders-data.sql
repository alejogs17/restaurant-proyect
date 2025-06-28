-- Insert sample orders data
INSERT INTO public.orders (order_number, table_id, user_id, status, order_type, customer_name, customer_phone, customer_address, subtotal, tax, discount, total, notes, created_at) VALUES
('ORD-2024-001', 1, NULL, 'completed', 'dine_in', 'Juan Pérez', NULL, NULL, 45.00, 4.50, 0.00, 49.50, 'Sin cebolla en la hamburguesa', NOW() - INTERVAL '2 days'),
('ORD-2024-002', 3, NULL, 'completed', 'dine_in', 'María García', NULL, NULL, 32.50, 3.25, 5.00, 30.75, 'Extra queso en la pizza', NOW() - INTERVAL '1 day'),
('ORD-2024-003', NULL, NULL, 'delivered', 'delivery', 'Carlos López', '+1234567890', 'Calle Principal 123', 28.00, 2.80, 0.00, 30.80, 'Entregar en la puerta trasera', NOW() - INTERVAL '12 hours'),
('ORD-2024-004', NULL, NULL, 'completed', 'takeout', 'Ana Rodríguez', '+0987654321', NULL, 18.50, 1.85, 0.00, 20.35, 'Para llevar', NOW() - INTERVAL '6 hours'),
('ORD-2024-005', 2, NULL, 'ready', 'dine_in', 'Luis Martínez', NULL, NULL, 55.00, 5.50, 10.00, 50.50, 'Sin hielo en las bebidas', NOW() - INTERVAL '2 hours'),
('ORD-2024-006', 4, NULL, 'preparing', 'dine_in', 'Carmen Silva', NULL, NULL, 42.00, 4.20, 0.00, 46.20, 'Bien cocida la carne', NOW() - INTERVAL '1 hour'),
('ORD-2024-007', NULL, NULL, 'pending', 'delivery', 'Roberto Díaz', '+1122334455', 'Avenida Central 456', 35.50, 3.55, 0.00, 39.05, 'Llamar antes de llegar', NOW() - INTERVAL '30 minutes'),
('ORD-2024-008', 5, NULL, 'pending', 'dine_in', 'Patricia Vega', NULL, NULL, 25.00, 2.50, 0.00, 27.50, 'Sin sal en las papas', NOW() - INTERVAL '15 minutes'),
('ORD-2024-009', NULL, NULL, 'cancelled', 'takeout', 'Miguel Torres', '+1555666777', NULL, 15.00, 1.50, 0.00, 16.50, 'Cancelado por cliente', NOW() - INTERVAL '45 minutes'),
('ORD-2024-010', 1, NULL, 'completed', 'dine_in', 'Sofia Ruiz', NULL, NULL, 38.00, 3.80, 5.00, 36.80, 'Extra salsa picante', NOW() - INTERVAL '3 days');

-- Insert sample order items data
INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price, notes, status, created_at) VALUES
-- Order 1 items
(1, 1, 2, 12.00, 24.00, 'Sin cebolla', 'delivered', NOW() - INTERVAL '2 days'),
(1, 3, 1, 8.00, 8.00, NULL, 'delivered', NOW() - INTERVAL '2 days'),
(1, 5, 1, 13.00, 13.00, NULL, 'delivered', NOW() - INTERVAL '2 days'),

-- Order 2 items
(2, 2, 1, 18.00, 18.00, 'Extra queso', 'delivered', NOW() - INTERVAL '1 day'),
(2, 4, 1, 6.50, 6.50, NULL, 'delivered', NOW() - INTERVAL '1 day'),
(2, 6, 1, 8.00, 8.00, NULL, 'delivered', NOW() - INTERVAL '1 day'),

-- Order 3 items
(3, 1, 1, 12.00, 12.00, NULL, 'delivered', NOW() - INTERVAL '12 hours'),
(3, 7, 1, 9.00, 9.00, NULL, 'delivered', NOW() - INTERVAL '12 hours'),
(3, 8, 1, 7.00, 7.00, NULL, 'delivered', NOW() - INTERVAL '12 hours'),

-- Order 4 items
(4, 3, 1, 8.00, 8.00, NULL, 'delivered', NOW() - INTERVAL '6 hours'),
(4, 5, 1, 13.00, 13.00, NULL, 'delivered', NOW() - INTERVAL '6 hours'),
(4, 9, 1, 5.50, 5.50, NULL, 'delivered', NOW() - INTERVAL '6 hours'),

-- Order 5 items
(5, 2, 1, 18.00, 18.00, NULL, 'ready', NOW() - INTERVAL '2 hours'),
(5, 1, 2, 12.00, 24.00, 'Sin hielo', 'ready', NOW() - INTERVAL '2 hours'),
(5, 4, 1, 6.50, 6.50, NULL, 'ready', NOW() - INTERVAL '2 hours'),
(5, 10, 1, 6.50, 6.50, NULL, 'ready', NOW() - INTERVAL '2 hours'),

-- Order 6 items
(6, 1, 1, 12.00, 12.00, 'Bien cocida', 'preparing', NOW() - INTERVAL '1 hour'),
(6, 2, 1, 18.00, 18.00, NULL, 'preparing', NOW() - INTERVAL '1 hour'),
(6, 3, 1, 8.00, 8.00, NULL, 'preparing', NOW() - INTERVAL '1 hour'),
(6, 6, 1, 8.00, 8.00, NULL, 'preparing', NOW() - INTERVAL '1 hour'),

-- Order 7 items
(7, 2, 1, 18.00, 18.00, NULL, 'pending', NOW() - INTERVAL '30 minutes'),
(7, 5, 1, 13.00, 13.00, NULL, 'pending', NOW() - INTERVAL '30 minutes'),
(7, 7, 1, 9.00, 9.00, NULL, 'pending', NOW() - INTERVAL '30 minutes'),

-- Order 8 items
(8, 1, 1, 12.00, 12.00, 'Sin sal', 'pending', NOW() - INTERVAL '15 minutes'),
(8, 4, 1, 6.50, 6.50, NULL, 'pending', NOW() - INTERVAL '15 minutes'),
(8, 8, 1, 7.00, 7.00, NULL, 'pending', NOW() - INTERVAL '15 minutes'),

-- Order 9 items (cancelled)
(9, 3, 1, 8.00, 8.00, NULL, 'cancelled', NOW() - INTERVAL '45 minutes'),
(9, 9, 1, 5.50, 5.50, NULL, 'cancelled', NOW() - INTERVAL '45 minutes'),
(9, 10, 1, 6.50, 6.50, NULL, 'cancelled', NOW() - INTERVAL '45 minutes'),

-- Order 10 items
(10, 1, 1, 12.00, 12.00, 'Extra salsa', 'delivered', NOW() - INTERVAL '3 days'),
(10, 2, 1, 18.00, 18.00, NULL, 'delivered', NOW() - INTERVAL '3 days'),
(10, 6, 1, 8.00, 8.00, NULL, 'delivered', NOW() - INTERVAL '3 days');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON public.order_items(status);

-- Grant permissions
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 