-- Add bank account fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN bank_name text,
ADD COLUMN bank_account_number text;