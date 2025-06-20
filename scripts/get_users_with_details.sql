-- Drop the function if it exists to ensure a clean update
DROP FUNCTION IF EXISTS public.get_users_with_details();

-- Create a function to securely get user details including email and last_sign_in_at
CREATE OR REPLACE FUNCTION public.get_users_with_details()
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  avatar_url TEXT,
  total_orders INTEGER,
  total_sales DECIMAL,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  -- This query joins profiles with auth.users to get all the necessary data
  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    u.email,
    p.phone,
    p.role,
    p.status,
    p.created_at,
    p.avatar_url,
    p.total_orders,
    p.total_sales,
    u.last_sign_in_at
  FROM
    public.profiles p
  LEFT JOIN
    auth.users u ON p.id = u.id
  ORDER BY
    p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the 'authenticated' role so it can be called from the app
GRANT EXECUTE ON FUNCTION public.get_users_with_details() TO authenticated; 