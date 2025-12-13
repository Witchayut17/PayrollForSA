import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calculator, Plus, Save, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";

// Thai tax brackets (simplified)
const calculateTax = (annualIncome: number): number => {
  let tax = 0;
  if (annualIncome > 5000000) tax += (annualIncome - 5000000) * 0.35;
  if (annualIncome > 2000000) tax += Math.min(annualIncome - 2000000, 3000000) * 0.30;
  if (annualIncome > 1000000) tax += Math.min(annualIncome - 1000000, 1000000) * 0.25;
  if (annualIncome > 500000) tax += Math.min(annualIncome - 500000, 500000) * 0.20;
  if (annualIncome > 300000) tax += Math.min(annualIncome - 300000, 200000) * 0.15;
  if (annualIncome > 150000) tax += Math.min(annualIncome - 150000, 150000) * 0.05;
  return Math.round(tax / 12); // Monthly tax
};

// Social security calculation (5% capped at 750 THB)
const calculateSocialSecurity = (grossPay: number): number => {
  return Math.min(grossPay * 0.05, 750);
};

export function SalaryCalculatorView() {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [payPeriodStart, setPayPeriodStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [payPeriodEnd, setPayPeriodEnd] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [overtimePay, setOvertimePay] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [commission, setCommission] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [calculatedPayslip, setCalculatedPayslip] = useState<any>(null);

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: salaries } = useQuery({
    queryKey: ["all-salaries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salaries")
        .select("*")
        .order("effective_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createPayslipMutation = useMutation({
    mutationFn: async (payslipData: any) => {
      const { error } = await supabase.from("payslips").insert(payslipData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      toast.success("Payslip generated successfully!");
      setShowGenerateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to generate payslip: " + error.message);
    },
  });

  const resetForm = () => {
    setSelectedEmployee("");
    setOvertimePay(0);
    setBonus(0);
    setCommission(0);
    setOtherDeductions(0);
    setCalculatedPayslip(null);
  };

  // Get latest salary for selected employee
  const getEmployeeSalary = (userId: string) => {
    return salaries?.find((s) => s.user_id === userId);
  };

  const handleCalculate = () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    const salary = getEmployeeSalary(selectedEmployee);
    if (!salary) {
      toast.error("No salary data found for this employee");
      return;
    }

    const baseSalary = Number(salary.base_salary);
    const allowances =
      Number(salary.housing_allowance || 0) +
      Number(salary.transport_allowance || 0) +
      Number(salary.other_allowances || 0);

    const grossPay = baseSalary + allowances + overtimePay + bonus + commission;
    const annualIncome = (baseSalary + allowances) * 12; // Estimate for tax
    const taxDeduction = calculateTax(annualIncome);
    const socialSecurity = calculateSocialSecurity(grossPay);
    const totalDeductions = taxDeduction + socialSecurity + otherDeductions;
    const netPay = grossPay - totalDeductions;

    setCalculatedPayslip({
      user_id: selectedEmployee,
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
      base_salary: baseSalary,
      allowances: allowances,
      overtime_pay: overtimePay,
      bonus: bonus,
      commission: commission,
      gross_pay: grossPay,
      tax_deduction: taxDeduction,
      social_security: socialSecurity,
      other_deductions: otherDeductions,
      net_pay: netPay,
      status: "pending",
    });
  };

  const handleGeneratePayslip = () => {
    if (!calculatedPayslip) return;
    setShowGenerateDialog(true);
  };

  const confirmGeneratePayslip = () => {
    createPayslipMutation.mutate(calculatedPayslip);
  };

  const selectedProfile = profiles?.find((p) => p.id === selectedEmployee);
  const selectedSalary = selectedEmployee ? getEmployeeSalary(selectedEmployee) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Salary Calculator</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Calculate Salary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Employee</Label>
              {profilesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name} ({profile.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pay Period Start</Label>
                <Input type="date" value={payPeriodStart} onChange={(e) => setPayPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pay Period End</Label>
                <Input type="date" value={payPeriodEnd} onChange={(e) => setPayPeriodEnd(e.target.value)} />
              </div>
            </div>

            {selectedSalary && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">Current Salary Structure:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Base Salary:</span>
                  <span>฿{Number(selectedSalary.base_salary).toLocaleString()}</span>
                  <span className="text-muted-foreground">Housing Allowance:</span>
                  <span>฿{Number(selectedSalary.housing_allowance || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">Transport Allowance:</span>
                  <span>฿{Number(selectedSalary.transport_allowance || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">Other Allowances:</span>
                  <span>฿{Number(selectedSalary.other_allowances || 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Overtime Pay (฿)</Label>
              <Input
                type="number"
                value={overtimePay}
                onChange={(e) => setOvertimePay(Number(e.target.value))}
                min={0}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bonus (฿)</Label>
                <Input type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} min={0} />
              </div>
              <div className="space-y-2">
                <Label>Commission (฿)</Label>
                <Input
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Other Deductions (฿)</Label>
              <Input
                type="number"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(Number(e.target.value))}
                min={0}
              />
            </div>

            <Button onClick={handleCalculate} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate
            </Button>
          </CardContent>
        </Card>

        {/* Calculation Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payslip Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calculatedPayslip ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">{selectedProfile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedProfile?.employee_id} | Period: {format(new Date(payPeriodStart), "MMM d")} -{" "}
                    {format(new Date(payPeriodEnd), "MMM d, yyyy")}
                  </p>
                </div>

                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Base Salary</TableCell>
                      <TableCell className="text-right">฿{calculatedPayslip.base_salary.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Allowances</TableCell>
                      <TableCell className="text-right text-green-600">
                        +฿{calculatedPayslip.allowances.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Overtime Pay</TableCell>
                      <TableCell className="text-right text-green-600">
                        +฿{calculatedPayslip.overtime_pay.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Bonus</TableCell>
                      <TableCell className="text-right text-green-600">
                        +฿{calculatedPayslip.bonus.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Commission</TableCell>
                      <TableCell className="text-right text-green-600">
                        +฿{calculatedPayslip.commission.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">Gross Pay</TableCell>
                      <TableCell className="text-right font-bold">
                        ฿{calculatedPayslip.gross_pay.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tax Deduction</TableCell>
                      <TableCell className="text-right text-red-600">
                        -฿{calculatedPayslip.tax_deduction.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Social Security (5%)</TableCell>
                      <TableCell className="text-right text-red-600">
                        -฿{calculatedPayslip.social_security.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Other Deductions</TableCell>
                      <TableCell className="text-right text-red-600">
                        -฿{calculatedPayslip.other_deductions.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10">
                      <TableCell className="font-bold text-primary">Net Pay</TableCell>
                      <TableCell className="text-right font-bold text-primary text-lg">
                        ฿{calculatedPayslip.net_pay.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Button onClick={handleGeneratePayslip} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Generate Payslip
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an employee and click Calculate to preview payslip</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payslip Generation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>You are about to generate a payslip for:</p>
            <div className="bg-muted p-4 rounded-lg mt-4 space-y-2">
              <p>
                <strong>Employee:</strong> {selectedProfile?.full_name}
              </p>
              <p>
                <strong>Period:</strong> {payPeriodStart} to {payPeriodEnd}
              </p>
              <p>
                <strong>Net Pay:</strong> ฿{calculatedPayslip?.net_pay.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmGeneratePayslip} disabled={createPayslipMutation.isPending}>
              {createPayslipMutation.isPending ? "Generating..." : "Confirm & Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
