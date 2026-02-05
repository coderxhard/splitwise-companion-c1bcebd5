-- Fix: Group invite codes visible to all members including expired codes
-- Solution: Create a secure RPC function that returns group data with invite_code only for creators

-- Create a function to get group details with conditional invite code visibility
CREATE OR REPLACE FUNCTION public.get_group_with_invite_code(_group_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  type text,
  invite_code text,
  invite_code_expires_at timestamptz,
  invite_code_single_use boolean,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    g.id,
    g.name,
    g.description,
    g.type,
    -- Only show invite_code to the group creator
    CASE WHEN g.created_by = auth.uid() THEN g.invite_code ELSE NULL END as invite_code,
    CASE WHEN g.created_by = auth.uid() THEN g.invite_code_expires_at ELSE NULL END as invite_code_expires_at,
    CASE WHEN g.created_by = auth.uid() THEN g.invite_code_single_use ELSE NULL END as invite_code_single_use,
    g.created_by,
    g.created_at,
    g.updated_at
  FROM public.groups g
  WHERE g.id = _group_id
    AND public.is_group_member(auth.uid(), g.id)
$$;