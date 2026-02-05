-- Fix: Make avatars bucket public so getPublicUrl() works correctly
-- Avatars are user profile pictures that should be publicly viewable

UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';

-- Ensure public SELECT policy exists (replace authenticated-only policy)
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

CREATE POLICY "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');