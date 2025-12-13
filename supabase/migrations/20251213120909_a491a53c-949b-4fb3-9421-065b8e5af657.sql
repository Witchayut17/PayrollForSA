-- Add HR policies for profiles and user_roles
CREATE POLICY "HR can view all profiles" ON public.profiles
FOR SELECT USING (has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "HR can manage all roles" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'hr'::app_role));