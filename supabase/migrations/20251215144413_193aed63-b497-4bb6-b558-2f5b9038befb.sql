-- Allow users to manage their own roles (for demo purposes)
CREATE POLICY "Users can manage their own roles for demo" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);