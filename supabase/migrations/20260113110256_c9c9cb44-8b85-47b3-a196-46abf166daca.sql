-- Drop the overly permissive policy that allows viewing all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that restricts profile visibility to:
-- 1. The user's own profile
-- 2. Profiles of users who share at least one group with the current user
CREATE POLICY "Users can view own and group member profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.user_id
  )
);