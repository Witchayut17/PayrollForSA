import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function PayrollReviewView() {
  const { user } = useAuth();

  const { data: salary, isLoading: salaryLoading } = useQuery({
    queryKey: ["salary", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salaries")
        .select("*")
        .eq("user_id", user!.id)
        .order("effective_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: latestPayslip, isLoading: payslipLoading } = useQuery({
    queryKey: ["latestPayslip", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslips")
        .select("*")
        .eq("user_id", user!.id)
        .order("pay_period_end", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = salaryLoading || payslipLoading;

  const totalAllowances = salary 
    ? Number(salary.housing_allowance) + Number(salary.transport_allowance) + Number(salary.other_allowances)
    : 0;

  const totalDeductions = latestPayslip
    ? Number(latestPayslip.tax_deduction) + Number(latestPayslip.social_security) + Number(latestPayslip.other_deductions)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Payroll Review</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                ฿{salary ? Number(salary.base_salary).toLocaleString() : "0"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Monthly base pay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allowances</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                +฿{totalAllowances.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Housing, Transport, Other</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                -฿{totalDeductions.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Tax, Social Security</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-primary">
                ฿{latestPayslip ? Number(latestPayslip.net_pay).toLocaleString() : "0"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Last payslip amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Salary Details */}
      <Card>
        <CardHeader>
          <CardTitle>Current Salary Structure</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : salary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Base Salary</p>
                  <p className="text-lg font-semibold">฿{Number(salary.base_salary).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Housing Allowance</p>
                  <p className="text-lg font-semibold">฿{Number(salary.housing_allowance).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transport Allowance</p>
                  <p className="text-lg font-semibold">฿{Number(salary.transport_allowance).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Other Allowances</p>
                  <p className="text-lg font-semibold">฿{Number(salary.other_allowances).toLocaleString()}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Effective Since</p>
                <p className="text-lg font-semibold">{new Date(salary.effective_date).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No salary information available. Please contact HR.</p>
          )}
        </CardContent>
      </Card>

      {/* Latest Payslip Details */}
      {latestPayslip && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Payslip Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pay Period</p>
                  <p className="font-semibold">
                    {new Date(latestPayslip.pay_period_start).toLocaleDateString()} - {new Date(latestPayslip.pay_period_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gross Pay</p>
                  <p className="font-semibold">฿{Number(latestPayslip.gross_pay).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overtime Pay</p>
                  <p className="font-semibold text-green-600">+฿{Number(latestPayslip.overtime_pay).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tax Deduction</p>
                  <p className="font-semibold text-red-600">-฿{Number(latestPayslip.tax_deduction).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Social Security</p>
                  <p className="font-semibold text-red-600">-฿{Number(latestPayslip.social_security).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Other Deductions</p>
                  <p className="font-semibold text-red-600">-฿{Number(latestPayslip.other_deductions).toLocaleString()}</p>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Net Pay</p>
                  <p className="text-2xl font-bold text-primary">฿{Number(latestPayslip.net_pay).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  latestPayslip.status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {latestPayslip.status.charAt(0).toUpperCase() + latestPayslip.status.slice(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
