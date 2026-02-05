-- Fix: User Email Addresses Exposed to Other Group Members
-- This migration restricts email visibility by:
-- 1. Updating the RLS policy to only allow viewing own profile directly
-- 2. Creating a secure RPC function to get group member profiles (without email)

-- Step 1: Drop the existing policy that exposes emails to group members
DROP POLICY IF EXISTS "Users can view own and group member profiles" ON public.profiles;

-- Step 2: Create a new restrictive policy - users can only view their own profile
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Step 3: Create a security definer function to get group member profiles without email
CREATE OR REPLACE FUNCTION public.get_group_member_profiles(_group_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.name,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  INNER JOIN public.group_members gm ON gm.user_id = p.user_id
  WHERE gm.group_id = _group_id
    AND public.is_group_member(auth.uid(), _group_id)
$$;