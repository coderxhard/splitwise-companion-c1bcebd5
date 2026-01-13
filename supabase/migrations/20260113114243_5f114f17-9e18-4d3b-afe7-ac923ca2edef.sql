-- Add expiration tracking to groups table
ALTER TABLE public.groups 
ADD COLUMN invite_code_expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
ADD COLUMN invite_code_single_use boolean DEFAULT true;

-- Update existing groups to have expiration set
UPDATE public.groups SET invite_code_expires_at = now() + interval '7 days' WHERE invite_code_expires_at IS NULL;

-- Create function to regenerate invite code
CREATE OR REPLACE FUNCTION public.regenerate_invite_code(group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
BEGIN
  -- Only allow group creator to regenerate
  IF NOT EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only group creator can regenerate invite code';
  END IF;
  
  new_code := encode(extensions.gen_random_bytes(6), 'hex');
  
  UPDATE public.groups 
  SET 
    invite_code = new_code,
    invite_code_expires_at = now() + interval '7 days',
    updated_at = now()
  WHERE id = group_id;
  
  RETURN new_code;
END;
$$;

-- Create function to auto-regenerate after join (for single-use codes)
CREATE OR REPLACE FUNCTION public.auto_regenerate_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if single_use is enabled for this group
  IF EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = NEW.group_id AND invite_code_single_use = true
  ) THEN
    UPDATE public.groups 
    SET 
      invite_code = encode(extensions.gen_random_bytes(6), 'hex'),
      invite_code_expires_at = now() + interval '7 days',
      updated_at = now()
    WHERE id = NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-regenerate on new member join
CREATE TRIGGER regenerate_invite_code_on_join
AFTER INSERT ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.auto_regenerate_invite_code();