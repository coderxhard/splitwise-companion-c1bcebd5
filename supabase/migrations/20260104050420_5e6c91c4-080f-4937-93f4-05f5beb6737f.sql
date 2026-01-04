-- Drop existing restrictive policies on groups table
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Members can view groups" ON public.groups;
DROP POLICY IF EXISTS "Creators can update groups" ON public.groups;
DROP POLICY IF EXISTS "Creators can delete groups" ON public.groups;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Authenticated users can create groups" 
ON public.groups 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view groups" 
ON public.groups 
FOR SELECT 
TO authenticated
USING (is_group_member(auth.uid(), id));

CREATE POLICY "Creators can update groups" 
ON public.groups 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete groups" 
ON public.groups 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);