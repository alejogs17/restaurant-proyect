-- Add status column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'inactive'));

-- Update existing profiles to have 'active' status if they don't have one
UPDATE profiles SET status = 'active' WHERE status IS NULL;

-- Add phone column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create function to update user status
CREATE OR REPLACE FUNCTION update_user_status(user_id UUID, new_status TEXT)
RETURNS void AS $$
BEGIN
  -- Validate status
  IF new_status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Invalid status. Must be active or inactive';
  END IF;

  -- Update profile status
  UPDATE profiles 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = user_id;

  -- Update user metadata
  UPDATE auth.users 
  SET 
    raw_user_meta_data = raw_user_meta_data || jsonb_build_object('status', new_status)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER; 