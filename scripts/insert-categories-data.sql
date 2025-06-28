-- Insert sample categories data
INSERT INTO public.categories (name, description) VALUES
('Hamburguesas', 'Hamburguesas gourmet con diferentes tipos de carne'),
('Pizzas', 'Pizzas artesanales con ingredientes frescos'),
('Bebidas', 'Bebidas refrescantes y calientes'),
('Postres', 'Postres caseros y deliciosos'),
('Acompañamientos', 'Papas fritas, ensaladas y otros acompañamientos'),
('Platos Principales', 'Platos principales del día'),
('Entradas', 'Entradas y aperitivos'),
('Especialidades', 'Platos especiales de la casa');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);

-- Grant permissions
GRANT ALL ON public.categories TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 