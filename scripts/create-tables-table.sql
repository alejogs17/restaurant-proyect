-- Create tables table
CREATE TABLE IF NOT EXISTS public.tables (
  id SERIAL PRIMARY KEY,
  table_number VARCHAR(10) NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample tables data
INSERT INTO public.tables (table_number, capacity, status, location) VALUES
('T1', 4, 'available', 'Sala Principal'),
('T2', 6, 'occupied', 'Sala Principal'),
('T3', 4, 'available', 'Terraza'),
('T4', 8, 'occupied', 'Sala Privada'),
('T5', 4, 'available', 'Sala Principal'),
('T6', 6, 'reserved', 'Terraza'),
('T7', 4, 'maintenance', 'Sala Principal'),
('T8', 8, 'available', 'Sala Privada');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_location ON public.tables(location);

-- Grant permissions
GRANT ALL ON public.tables TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 