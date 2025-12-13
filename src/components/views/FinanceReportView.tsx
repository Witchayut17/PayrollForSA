import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, FileText, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export function FinanceReportView() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(currentDate, i);
    return { value: format(date, "yyyy-MM"), label: format(date, "MMMM yyyy") };
  });

  const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
  const monthEnd = endOfMonth(new Date(selectedMonth + "-01"));

  const { data: payslips, isLoading } = useQuery({
    queryKey: ["finance-payslips", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslips")
        .select("*")
        .gte("pay_period_start", format(monthStart, "yyyy-MM-dd"))
        .lte("pay_period_end", format(monthEnd, "yyyy-MM-dd"));

      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  // Calculate summary statistics
  const totalGrossPay = payslips?.reduce((sum, p) => sum + Number(p.gross_pay), 0) || 0;
  const totalNetPay = payslips?.reduce((sum, p) => sum + Number(p.net_pay), 0) || 0;
  const totalTaxDeductions = payslips?.reduce((sum, p) => sum + Number(p.tax_deduction || 0), 0) || 0;
  const totalSocialSecurity = payslips?.reduce((sum, p) => sum + Number(p.social_security || 0), 0) || 0;
  const totalOtherDeductions = payslips?.reduce((sum, p) => sum + Number(p.other_deductions || 0), 0) || 0;
  const totalDeductions = totalTaxDeductions + totalSocialSecurity + totalOtherDeductions;
  const totalBonus = payslips?.reduce((sum, p) => sum + Number(p.bonus || 0), 0) || 0;
  const totalCommission = payslips?.reduce((sum, p) => sum + Number(p.commission || 0), 0) || 0;
  const totalOvertimePay = payslips?.reduce((sum, p) => sum + Number(p.overtime_pay || 0), 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Finance Report</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                ฿{totalGrossPay.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Income before deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                ฿{totalDeductions.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Tax, SS & Other</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-primary">
                ฿{totalNetPay.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Actual payout amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees Paid</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{payslips?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Payslips generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expense Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Income Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Salaries</span>
              <span className="font-semibold">
                ฿{payslips?.reduce((sum, p) => sum + Number(p.base_salary), 0).toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allowances</span>
              <span className="font-semibold">
                ฿{payslips?.reduce((sum, p) => sum + Number(p.allowances || 0), 0).toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Overtime Pay</span>
              <span className="font-semibold">฿{totalOvertimePay.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bonus</span>
              <span className="font-semibold">฿{totalBonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commission</span>
              <span className="font-semibold">฿{totalCommission.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t flex justify-between">
              <span className="font-bold">Total Gross</span>
              <span className="font-bold text-green-600">฿{totalGrossPay.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Expense Breakdown (Deductions)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax Deductions</span>
              <span className="font-semibold">฿{totalTaxDeductions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Social Security</span>
              <span className="font-semibold">฿{totalSocialSecurity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Other Deductions</span>
              <span className="font-semibold">฿{totalOtherDeductions.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t flex justify-between">
              <span className="font-bold">Total Deductions</span>
              <span className="font-bold text-red-600">฿{totalDeductions.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t flex justify-between">
              <span className="font-bold text-primary">Net Payroll Cost</span>
              <span className="font-bold text-primary">฿{totalNetPay.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payslips && payslips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Social Sec.</TableHead>
                  <TableHead className="text-right">Other Ded.</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => {
                  const profile = profileMap.get(payslip.user_id);
                  return (
                    <TableRow key={payslip.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{profile?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{profile?.employee_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">฿{Number(payslip.gross_pay).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">
                        -฿{Number(payslip.tax_deduction || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -฿{Number(payslip.social_security || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -฿{Number(payslip.other_deductions || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ฿{Number(payslip.net_pay).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payslip.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payslip.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No payroll data for this month.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
