-- Drop the overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;

-- Create a proper INSERT policy that only allows users to insert notifications for themselves
-- or allows authenticated users to insert notifications for group members (for expense/settlement notifications)
CREATE POLICY "Authenticated users can insert notifications for group members"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Either inserting for yourself
  auth.uid() = user_id
  OR 
  -- Or inserting for a group member when you're also a member of that group
  (
    group_id IS NOT NULL 
    AND is_group_member(auth.uid(), group_id) 
    AND is_group_member(user_id, group_id)
  )
);