-- Create salaries table to store employee salary information
CREATE TABLE public.salaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  housing_allowance DECIMAL(12,2) DEFAULT 0,
  transport_allowance DECIMAL(12,2) DEFAULT 0,
  other_allowances DECIMAL(12,2) DEFAULT 0,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, effective_date)
);

-- Create payslips table
CREATE TABLE public.payslips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  base_salary DECIMAL(12,2) NOT NULL,
  allowances DECIMAL(12,2) DEFAULT 0,
  overtime_pay DECIMAL(12,2) DEFAULT 0,
  gross_pay DECIMAL(12,2) NOT NULL,
  tax_deduction DECIMAL(12,2) DEFAULT 0,
  social_security DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  net_pay DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ot_requests table (overtime requests)
CREATE TABLE public.ot_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salaries
CREATE POLICY "Users can view their own salary" ON public.salaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "HR can view all salaries" ON public.salaries
  FOR SELECT USING (public.has_role(auth.uid(), 'hr'));

CREATE POLICY "Accountant can view all salaries" ON public.salaries
  FOR SELECT USING (public.has_role(auth.uid(), 'accountant'));

CREATE POLICY "HR can manage salaries" ON public.salaries
  FOR ALL USING (public.has_role(auth.uid(), 'hr'));

-- RLS Policies for payslips
CREATE POLICY "Users can view their own payslips" ON public.payslips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "HR can view all payslips" ON public.payslips
  FOR SELECT USING (public.has_role(auth.uid(), 'hr'));

CREATE POLICY "Accountant can manage payslips" ON public.payslips
  FOR ALL USING (public.has_role(auth.uid(), 'accountant'));

-- RLS Policies for leave_requests
CREATE POLICY "Users can view their own leave requests" ON public.leave_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leave requests" ON public.leave_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending leave requests" ON public.leave_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "HR can manage all leave requests" ON public.leave_requests
  FOR ALL USING (public.has_role(auth.uid(), 'hr'));

-- RLS Policies for ot_requests
CREATE POLICY "Users can view their own OT requests" ON public.ot_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own OT requests" ON public.ot_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending OT requests" ON public.ot_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "HR can manage all OT requests" ON public.ot_requests
  FOR ALL USING (public.has_role(auth.uid(), 'hr'));

-- Create triggers for updated_at
CREATE TRIGGER update_salaries_updated_at
  BEFORE UPDATE ON public.salaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ot_requests_updated_at
  BEFORE UPDATE ON public.ot_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();