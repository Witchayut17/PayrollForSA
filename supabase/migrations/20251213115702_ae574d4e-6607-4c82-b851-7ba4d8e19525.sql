-- Create a sequence for employee IDs
CREATE SEQUENCE public.employee_id_seq START 1;

-- Update the handle_new_user function to auto-generate employee ID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, date_of_birth, employee_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    (NEW.raw_user_meta_data ->> 'date_of_birth')::DATE,
    'EMP' || LPAD(nextval('public.employee_id_seq')::TEXT, 5, '0')
  );
  
  -- Default role is employee
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;