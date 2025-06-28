-- First, let's clear existing products and insert them with proper categories
DELETE FROM public.products;

-- Insert products with proper category IDs
INSERT INTO public.products (name, description, price, cost, category_id, stock_quantity, min_stock_level, is_active, created_at) VALUES
-- Hamburguesas (category_id = 1)
('Hamburguesa Clásica', 'Hamburguesa con carne de res, lechuga, tomate y queso', 12.00, 6.00, 1, 50, 10, true, NOW()),
('Hamburguesa BBQ', 'Hamburguesa con salsa BBQ, cebolla caramelizada y bacon', 15.00, 7.50, 1, 30, 5, true, NOW()),
('Hamburguesa Vegetariana', 'Hamburguesa de garbanzos con vegetales frescos', 13.00, 6.50, 1, 20, 5, true, NOW()),

-- Pizzas (category_id = 2)
('Pizza Margherita', 'Pizza con tomate, mozzarella y albahaca', 18.00, 9.00, 2, 25, 5, true, NOW()),
('Pizza Pepperoni', 'Pizza con pepperoni, queso y salsa de tomate', 20.00, 10.00, 2, 30, 5, true, NOW()),
('Pizza Hawaiana', 'Pizza con jamón, piña y queso', 19.00, 9.50, 2, 20, 5, true, NOW()),

-- Bebidas (category_id = 3)
('Coca Cola', 'Refresco de cola 500ml', 8.00, 2.00, 3, 100, 20, true, NOW()),
('Limonada Natural', 'Limonada fresca casera', 7.00, 1.50, 3, 50, 10, true, NOW()),
('Café Americano', 'Café negro americano', 5.50, 1.00, 3, 80, 15, true, NOW()),
('Té Helado', 'Té helado con limón', 6.50, 1.25, 3, 40, 8, true, NOW()),

-- Postres (category_id = 4)
('Tiramisú', 'Postre italiano con café y mascarpone', 13.00, 5.00, 4, 15, 3, true, NOW()),
('Cheesecake', 'Tarta de queso con frutos rojos', 11.00, 4.50, 4, 12, 3, true, NOW()),
('Flan Casero', 'Flan de vainilla con caramelo', 9.00, 3.00, 4, 20, 5, true, NOW()),

-- Acompañamientos (category_id = 5)
('Papas Fritas', 'Papas fritas crujientes con sal', 6.50, 2.00, 5, 60, 15, true, NOW()),
('Ensalada César', 'Ensalada con lechuga, crutones y aderezo César', 8.00, 3.00, 5, 25, 5, true, NOW()),
('Aros de Cebolla', 'Aros de cebolla empanizados', 7.00, 2.50, 5, 30, 8, true, NOW()),

-- Platos Principales (category_id = 6)
('Pasta Carbonara', 'Pasta con salsa carbonara y panceta', 16.00, 7.00, 6, 20, 5, true, NOW()),
('Pollo a la Plancha', 'Pechuga de pollo a la plancha con vegetales', 14.00, 6.00, 6, 25, 5, true, NOW()),
('Salmón Grillado', 'Salmón fresco a la parrilla con limón', 22.00, 12.00, 6, 15, 3, true, NOW()),

-- Entradas (category_id = 7)
('Bruschetta', 'Pan tostado con tomate, albahaca y aceite de oliva', 7.00, 2.50, 7, 30, 8, true, NOW()),
('Guacamole', 'Guacamole fresco con totopos', 8.50, 3.00, 7, 20, 5, true, NOW()),
('Sopa del Día', 'Sopa casera del día', 6.00, 2.00, 7, 40, 10, true, NOW()),

-- Especialidades (category_id = 8)
('Paella Valenciana', 'Paella tradicional con mariscos y pollo', 25.00, 12.00, 8, 10, 2, true, NOW()),
('Risotto de Champiñones', 'Risotto cremoso con champiñones', 18.00, 8.00, 8, 15, 3, true, NOW()),
('Ceviche Peruano', 'Ceviche fresco con pescado y limón', 20.00, 10.00, 8, 12, 2, true, NOW());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock_quantity);

-- Grant permissions
GRANT ALL ON public.products TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 