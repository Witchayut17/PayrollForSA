-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'leave')),
  check_in TIME,
  check_out TIME,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, attendance_date)
);

-- Add bonus and commission columns to payslips
ALTER TABLE public.payslips 
ADD COLUMN IF NOT EXISTS bonus NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission NUMERIC DEFAULT 0;

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- HR can manage all attendance records
CREATE POLICY "HR can manage all attendance" ON public.attendance
FOR ALL USING (has_role(auth.uid(), 'hr'));

-- Employees can view their own attendance
CREATE POLICY "Users can view their own attendance" ON public.attendance
FOR SELECT USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();