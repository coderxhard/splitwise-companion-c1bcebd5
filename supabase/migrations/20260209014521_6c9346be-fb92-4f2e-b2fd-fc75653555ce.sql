-- Remove expiration from all existing invite codes so they work again
UPDATE groups 
SET invite_code_expires_at = NULL 
WHERE invite_code_expires_at IS NOT NULL;

-- Update the regenerate_invite_code function to not set expiration by default
CREATE OR REPLACE FUNCTION regenerate_invite_code(group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
BEGIN
  -- Generate a new random invite code
  new_code := encode(gen_random_bytes(6), 'hex');
  
  -- Update the group with the new code (no expiration)
  UPDATE groups 
  SET invite_code = new_code,
      invite_code_expires_at = NULL,
      updated_at = now()
  WHERE id = group_id;
  
  RETURN new_code;
END;
$$;