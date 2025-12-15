-- Add policy for accountants to view all profiles
CREATE POLICY "Accountant can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'accountant'::app_role));