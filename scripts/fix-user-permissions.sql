-- Fix user permissions for profile updates
-- This script ensures that users can be properly updated while maintaining security

-- First, let's check what policies exist and drop conflicting ones
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver y actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden gestionar perfiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile updates for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile selection for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile insertion for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile deletion for admins only" ON profiles;

-- Create a simple policy that allows authenticated users to read all profiles
-- This is needed for the admin panel to display users
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create a policy that allows users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create a policy that allows admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create a policy that allows authenticated users to insert profiles
-- This is needed for user creation
CREATE POLICY "Authenticated users can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create a policy that allows admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Ensure the profiles table has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON profiles TO authenticated;

-- Create a function to safely update user profiles (optional, for additional security)
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT,
  status TEXT
)
RETURNS void AS $$
BEGIN
  -- Validate role
  IF role NOT IN ('admin', 'waiter', 'cashier', 'chef') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin, waiter, cashier, or chef';
  END IF;

  -- Validate status
  IF status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Invalid status. Must be active or inactive';
  END IF;

  -- Update profile
  UPDATE profiles 
  SET 
    first_name = update_user_profile.first_name,
    last_name = update_user_profile.last_name,
    phone = update_user_profile.phone,
    role = update_user_profile.role,
    status = update_user_profile.status,
    updated_at = NOW()
  WHERE id = user_id;

  -- Check if any rows were affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated; 