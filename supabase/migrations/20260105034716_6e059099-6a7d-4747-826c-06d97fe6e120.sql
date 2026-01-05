-- Create settlements table to track payment history
CREATE TABLE public.settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  notes TEXT,
  settled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view group settlements"
ON public.settlements
FOR SELECT
USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can create settlements"
ON public.settlements
FOR INSERT
WITH CHECK (is_group_member(auth.uid(), group_id) AND auth.uid() = from_user_id);

CREATE POLICY "Creator can delete own settlements"
ON public.settlements
FOR DELETE
USING (auth.uid() = from_user_id);

-- Add index for faster lookups
CREATE INDEX idx_settlements_group_id ON public.settlements(group_id);
CREATE INDEX idx_settlements_settled_at ON public.settlements(settled_at DESC);