-- Simple fix for user permissions
-- This script only adds the necessary policies without breaking existing functionality

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver y actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden gestionar perfiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile updates for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile selection for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile insertion for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile deletion for admins only" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;

-- Create a simple policy that allows all authenticated users to read profiles
-- This is needed for the admin panel to display users
CREATE POLICY "Allow authenticated users to read profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create a policy that allows authenticated users to update profiles
-- This is needed for admin functionality
CREATE POLICY "Allow authenticated users to update profiles"
  ON profiles FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create a policy that allows authenticated users to insert profiles
-- This is needed for user creation
CREATE POLICY "Allow authenticated users to insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated; 