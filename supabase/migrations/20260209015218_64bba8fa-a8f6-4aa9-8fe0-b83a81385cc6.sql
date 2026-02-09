-- Create a secure function to look up a group by invite code (for joining)
-- This bypasses RLS so non-members can find the group to join
CREATE OR REPLACE FUNCTION public.lookup_group_by_invite_code(_invite_code text)
RETURNS TABLE (
  id uuid,
  name text,
  invite_code_expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, g.invite_code_expires_at
  FROM groups g
  WHERE g.invite_code = _invite_code;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.lookup_group_by_invite_code(text) TO authenticated;