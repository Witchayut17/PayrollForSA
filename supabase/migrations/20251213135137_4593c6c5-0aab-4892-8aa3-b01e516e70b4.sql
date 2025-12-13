-- Allow HR to insert and update payslips for bonus/commission management
CREATE POLICY "HR can manage payslips"
ON public.payslips
FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role));