-- Fix: Missing database constraint on settlement amounts
-- Add CHECK constraint to prevent negative or zero settlement amounts

ALTER TABLE public.settlements 
ADD CONSTRAINT settlements_amount_positive 
CHECK (amount > 0);