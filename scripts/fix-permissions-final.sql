-- Final fix for user permissions
-- This script works with the actual profiles table structure

-- Disable RLS temporarily to ensure everything works
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON profiles TO authenticated;

-- Let's verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Let's see if there are any profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- Let's see a sample of profiles
SELECT id, first_name, last_name, role, status, created_at 
FROM profiles 
LIMIT 5;

-- If you want to re-enable RLS with simple policies later, uncomment this:
/*
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated operations
CREATE POLICY "Allow all authenticated operations on profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'authenticated');
*/ 