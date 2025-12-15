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
import { th } from "date-fns/locale";

// Social security calculation (5% of base salary, capped at 750 THB)
const calculateSocialSecurity = (baseSalary: number): number => {
  return Math.min(baseSalary * 0.05, 750);
};

// Progressive tax calculation (Thai tax rates)
// Annual tax brackets:
// 0 - 150,000: 0%
// 150,001 - 300,000: 5%
// 300,001 - 500,000: 10%
// 500,001 - 750,000: 15%
// 750,001 - 1,000,000: 20%
// 1,000,001 - 2,000,000: 25%
// 2,000,001 - 5,000,000: 30%
// 5,000,001+: 35%
const calculateProgressiveTax = (annualIncome: number): number => {
  let tax = 0;
  
  if (annualIncome <= 150000) {
    tax = 0;
  } else if (annualIncome <= 300000) {
    tax = (annualIncome - 150000) * 0.05;
  } else if (annualIncome <= 500000) {
    tax = (150000 * 0.05) + (annualIncome - 300000) * 0.10;
  } else if (annualIncome <= 750000) {
    tax = (150000 * 0.05) + (200000 * 0.10) + (annualIncome - 500000) * 0.15;
  } else if (annualIncome <= 1000000) {
    tax = (150000 * 0.05) + (200000 * 0.10) + (250000 * 0.15) + (annualIncome - 750000) * 0.20;
  } else if (annualIncome <= 2000000) {
    tax = (150000 * 0.05) + (200000 * 0.10) + (250000 * 0.15) + (250000 * 0.20) + (annualIncome - 1000000) * 0.25;
  } else if (annualIncome <= 5000000) {
    tax = (150000 * 0.05) + (200000 * 0.10) + (250000 * 0.15) + (250000 * 0.20) + (1000000 * 0.25) + (annualIncome - 2000000) * 0.30;
  } else {
    tax = (150000 * 0.05) + (200000 * 0.10) + (250000 * 0.15) + (250000 * 0.20) + (1000000 * 0.25) + (3000000 * 0.30) + (annualIncome - 5000000) * 0.35;
  }
  
  return tax;
};

// Calculate monthly withholding tax
const calculateMonthlyTax = (monthlyGrossPay: number): number => {
  const annualIncome = monthlyGrossPay * 12;
  const annualTax = calculateProgressiveTax(annualIncome);
  return Math.round(annualTax / 12);
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
      toast.success("สร้างสลิปเงินเดือนสำเร็จ!");
      setShowGenerateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("ไม่สามารถสร้างสลิปเงินเดือน: " + error.message);
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
      toast.error("กรุณาเลือกพนักงาน");
      return;
    }

    const salary = getEmployeeSalary(selectedEmployee);
    if (!salary) {
      toast.error("ไม่พบข้อมูลเงินเดือนของพนักงานนี้");
      return;
    }

    const baseSalary = Number(salary.base_salary);
    const allowances =
      Number(salary.housing_allowance || 0) +
      Number(salary.transport_allowance || 0) +
      Number(salary.other_allowances || 0);

    const grossPay = baseSalary + allowances + overtimePay + bonus + commission;
    const socialSecurity = calculateSocialSecurity(baseSalary);
    const taxDeduction = calculateMonthlyTax(grossPay);
    const totalDeductions = socialSecurity + taxDeduction + otherDeductions;
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
        <h1 className="text-2xl font-bold text-foreground">เครื่องคำนวณเงินเดือน</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>คำนวณเงินเดือน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>เลือกพนักงาน</Label>
              {profilesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกพนักงาน" />
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
                <Label>วันเริ่มต้นงวด</Label>
                <Input type="date" value={payPeriodStart} onChange={(e) => setPayPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>วันสิ้นสุดงวด</Label>
                <Input type="date" value={payPeriodEnd} onChange={(e) => setPayPeriodEnd(e.target.value)} />
              </div>
            </div>

            {selectedSalary && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">โครงสร้างเงินเดือนปัจจุบัน:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">เงินเดือนพื้นฐาน:</span>
                  <span>฿{Number(selectedSalary.base_salary).toLocaleString()}</span>
                  <span className="text-muted-foreground">ค่าที่พัก:</span>
                  <span>฿{Number(selectedSalary.housing_allowance || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">ค่าเดินทาง:</span>
                  <span>฿{Number(selectedSalary.transport_allowance || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">เบี้ยเลี้ยงอื่นๆ:</span>
                  <span>฿{Number(selectedSalary.other_allowances || 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>ค่าล่วงเวลา (฿)</Label>
              <Input
                type="number"
                value={overtimePay}
                onChange={(e) => setOvertimePay(Number(e.target.value))}
                min={0}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>โบนัส (฿)</Label>
                <Input type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} min={0} />
              </div>
              <div className="space-y-2">
                <Label>คอมมิชชั่น (฿)</Label>
                <Input
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>หักอื่นๆ (฿)</Label>
              <Input
                type="number"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(Number(e.target.value))}
                min={0}
              />
            </div>

            <Button onClick={handleCalculate} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              คำนวณ
            </Button>
          </CardContent>
        </Card>

        {/* Calculation Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ตัวอย่างสลิปเงินเดือน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calculatedPayslip ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">{selectedProfile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedProfile?.employee_id} | งวด: {format(new Date(payPeriodStart), "d MMM", { locale: th })} -{" "}
                    {format(new Date(payPeriodEnd), "d MMM yyyy", { locale: th })}
                  </p>
                </div>

                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">เงินเดือนพื้นฐาน</TableCell>
                      <TableCell className="text-right">฿{calculatedPayslip.base_salary.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">เบี้ยเลี้ยง</TableCell>
                      <TableCell className="text-right text-green-600">
                        +฿{calculatedPayslip.allowances.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ค่าล่วงเวลา</TableCell>
                      <TableCell className="text-right text-green-600">
                        +฿{calculatedPayslip.overtime_pay.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">โบนัส</TableCell>
                      <TableCell className="text-right text-green-600">
                        +฿{calculatedPayslip.bonus.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">คอมมิชชั่น</TableCell>
                      <TableCell className="text-right text-green-600">
                        +฿{calculatedPayslip.commission.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">รายรับรวม</TableCell>
                      <TableCell className="text-right font-bold">
                        ฿{calculatedPayslip.gross_pay.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ประกันสังคม (5% ของเงินเดือนพื้นฐาน)</TableCell>
                      <TableCell className="text-right text-red-600">
                        -฿{calculatedPayslip.social_security.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ภาษีหัก ณ ที่จ่าย (รายปี÷12)</TableCell>
                      <TableCell className="text-right text-red-600">
                        -฿{calculatedPayslip.tax_deduction.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">หักอื่นๆ</TableCell>
                      <TableCell className="text-right text-red-600">
                        -฿{calculatedPayslip.other_deductions.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10">
                      <TableCell className="font-bold text-primary">รายรับสุทธิ</TableCell>
                      <TableCell className="text-right font-bold text-primary text-lg">
                        ฿{calculatedPayslip.net_pay.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Button onClick={handleGeneratePayslip} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  สร้างสลิปเงินเดือน
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>เลือกพนักงานและกดคำนวณเพื่อดูตัวอย่างสลิปเงินเดือน</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการสร้างสลิปเงินเดือน</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>คุณกำลังจะสร้างสลิปเงินเดือนสำหรับ:</p>
            <div className="bg-muted p-4 rounded-lg mt-4 space-y-2">
              <p>
                <strong>พนักงาน:</strong> {selectedProfile?.full_name}
              </p>
              <p>
                <strong>งวด:</strong> {payPeriodStart} ถึง {payPeriodEnd}
              </p>
              <p>
                <strong>รายรับสุทธิ:</strong> ฿{calculatedPayslip?.net_pay.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={confirmGeneratePayslip} disabled={createPayslipMutation.isPending}>
              {createPayslipMutation.isPending ? "กำลังสร้าง..." : "ยืนยันและสร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
