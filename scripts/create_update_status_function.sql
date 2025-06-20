-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.update_user_status;

-- Create function to update user status
CREATE OR REPLACE FUNCTION public.update_user_status(
  user_id UUID,
  new_status TEXT
)
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
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('status', new_status)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER; 