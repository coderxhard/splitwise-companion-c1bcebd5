-- Make avatars bucket private instead of public
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop the public access policy for avatars
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Create a new policy that requires authentication to view avatars
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');