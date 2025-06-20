-- Create tables for the restaurant management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table that extends the auth.users table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'waiter', 'cashier', 'chef')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  total_orders INTEGER DEFAULT 0,
  total_sales DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add email column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Create tables table to manage restaurant tables
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'reserved', 'payment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table for menu items
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table for menu items
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  unit TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  min_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  user_id UUID REFERENCES auth.users(id),
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id SERIAL PRIMARY KEY,
  purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
  inventory_item_id INTEGER REFERENCES inventory_items(id),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  table_id INTEGER REFERENCES tables(id),
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'completed', 'cancelled')),
  order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeout', 'delivery')),
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'mobile_payment', 'other')),
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies

-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Permitir a todos los usuarios autenticados ver todos los perfiles
CREATE POLICY "Usuarios autenticados pueden ver perfiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Permitir a los usuarios ver y actualizar su propio perfil
CREATE POLICY "Usuarios pueden ver y actualizar su propio perfil"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- Permitir a los administradores gestionar todos los perfiles
CREATE POLICY "Administradores pueden gestionar perfiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Permitir la creación inicial de perfiles
CREATE POLICY "Permitir creación inicial de perfiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'waiter');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert sample data for testing
INSERT INTO tables (name, capacity, status)
VALUES 
  ('Table 1', 4, 'available'),
  ('Table 2', 2, 'occupied'),
  ('Table 3', 6, 'occupied'),
  ('Table 4', 4, 'payment'),
  ('Table 5', 2, 'available'),
  ('Table 6', 8, 'reserved'),
  ('Table 7', 4, 'available'),
  ('Table 8', 4, 'occupied'),
  ('Table 9', 2, 'available'),
  ('Table 10', 6, 'reserved'),
  ('Table 11', 4, 'occupied'),
  ('Table 12', 2, 'available');

INSERT INTO categories (name, description)
VALUES 
  ('Appetizers', 'Starters and small plates'),
  ('Main Course', 'Primary dishes'),
  ('Desserts', 'Sweet treats'),
  ('Beverages', 'Drinks and refreshments'),
  ('Sides', 'Side dishes');

INSERT INTO products (name, description, price, category_id, active)
VALUES 
  ('Caesar Salad', 'Fresh romaine lettuce with Caesar dressing, croutons and parmesan', 10.99, 1, true),
  ('Grilled Salmon', 'Atlantic salmon with lemon butter sauce and seasonal vegetables', 24.99, 2, true),
  ('Chocolate Lava Cake', 'Warm chocolate cake with a molten center, served with vanilla ice cream', 8.99, 3, true),
  ('Margarita', 'Classic cocktail with tequila, lime juice, and triple sec', 9.99, 4, true),
  ('Beef Burger', 'Angus beef patty with lettuce, tomato, and special sauce on a brioche bun', 15.99, 2, true),
  ('French Fries', 'Crispy golden fries with sea salt', 5.99, 5, true),
  ('Chicken Wings', 'Spicy buffalo wings with blue cheese dip', 12.99, 1, true),
  ('Pasta Carbonara', 'Spaghetti with creamy sauce, pancetta, and parmesan', 16.99, 2, true),
  ('Cheesecake', 'New York style cheesecake with berry compote', 7.99, 3, true),
  ('Iced Tea', 'Freshly brewed and sweetened', 3.99, 4, true);

-- Insert sample users data
INSERT INTO auth.users (id, email, created_at)
VALUES 
  ('mg-001', 'maria.gonzalez@restaurante.com', NOW()),
  ('cr-002', 'carlos.rodriguez@restaurante.com', NOW()),
  ('am-003', 'ana.martinez@restaurante.com', NOW()),
  ('lh-004', 'luis.hernandez@restaurante.com', NOW()),
  ('ps-005', 'patricia.silva@restaurante.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample profiles data
INSERT INTO profiles (id, first_name, last_name, role, status, phone, created_at, last_sign_in_at, total_orders, total_sales)
VALUES 
  ('mg-001', 'Maria', 'González', 'admin', 'active', '+57 300 123 4567', NOW(), '2024-01-15 10:30:00', 0, 0),
  ('cr-002', 'Carlos', 'Rodriguez', 'waiter', 'active', '+57 310 987 6543', NOW(), '2024-01-15 14:20:00', 156, 8450000),
  ('am-003', 'Ana', 'Martinez', 'cashier', 'active', '+57 320 555 1234', NOW(), '2024-01-15 16:45:00', 0, 0),
  ('lh-004', 'Luis', 'Hernández', 'chef', 'active', '+57 315 444 7890', NOW(), '2024-01-15 08:15:00', 0, 0),
  ('ps-005', 'Patricia', 'Silva', 'waiter', 'inactive', '+57 325 666 3210', NOW(), '2024-01-10 12:00:00', 45, 2180000)
ON CONFLICT (id) DO NOTHING;
