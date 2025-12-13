-- Add new enum values (can't remove existing ones in postgres without recreating)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';