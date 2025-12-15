import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PayrollReviewView() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const isAccountant = role === "accountant";

  // Fetch all employees' payroll data for accountants
  const { data: allPayrollData, isLoading: allPayrollLoading } = useQuery({
    queryKey: ["allPayrollData"],
    queryFn: async () => {
      // Fetch profiles, salaries, and latest payslips
      const [profilesRes, salariesRes, payslipsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, employee_id"),
        supabase.from("salaries").select("*").order("effective_date", { ascending: false }),
        supabase.from("payslips").select("*").order("pay_period_end", { ascending: false }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (salariesRes.error) throw salariesRes.error;
      if (payslipsRes.error) throw payslipsRes.error;

      // Group salaries and payslips by user_id (latest only)
      const salaryMap = new Map();
      salariesRes.data?.forEach((s) => {
        if (!salaryMap.has(s.user_id)) {
          salaryMap.set(s.user_id, s);
        }
      });

      const payslipMap = new Map();
      payslipsRes.data?.forEach((p) => {
        if (!payslipMap.has(p.user_id)) {
          payslipMap.set(p.user_id, p);
        }
      });

      // Combine data
      return profilesRes.data?.map((profile) => {
        const salary = salaryMap.get(profile.id);
        const payslip = payslipMap.get(profile.id);
        const totalAllowances = salary
          ? Number(salary.housing_allowance || 0) +
            Number(salary.transport_allowance || 0) +
            Number(salary.other_allowances || 0)
          : 0;
        const totalDeductions = payslip
          ? Number(payslip.tax_deduction || 0) +
            Number(payslip.social_security || 0) +
            Number(payslip.other_deductions || 0)
          : 0;

        return {
          id: profile.id,
          employeeId: profile.employee_id,
          name: profile.full_name || "ไม่ระบุ",
          baseSalary: salary ? Number(salary.base_salary) : 0,
          allowances: totalAllowances,
          grossPay: payslip ? Number(payslip.gross_pay) : 0,
          deductions: totalDeductions,
          netPay: payslip ? Number(payslip.net_pay) : 0,
          status: payslip?.status || "ไม่มีสลิป",
          payPeriod: payslip
            ? `${new Date(payslip.pay_period_start).toLocaleDateString("th-TH")} - ${new Date(payslip.pay_period_end).toLocaleDateString("th-TH")}`
            : "ไม่ระบุ",
        };
      }) || [];
    },
    enabled: isAccountant,
  });

  // Employee's own data
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
    enabled: !!user?.id && !isAccountant,
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
    enabled: !!user?.id && !isAccountant,
  });

  // Summary calculations for accountant view
  const totals = allPayrollData?.reduce(
    (acc, emp) => ({
      totalBase: acc.totalBase + emp.baseSalary,
      totalAllowances: acc.totalAllowances + emp.allowances,
      totalGross: acc.totalGross + emp.grossPay,
      totalDeductions: acc.totalDeductions + emp.deductions,
      totalNet: acc.totalNet + emp.netPay,
    }),
    { totalBase: 0, totalAllowances: 0, totalGross: 0, totalDeductions: 0, totalNet: 0 }
  ) || { totalBase: 0, totalAllowances: 0, totalGross: 0, totalDeductions: 0, totalNet: 0 };

  const statusLabels: Record<string, string> = {
    paid: "จ่ายแล้ว",
    pending: "รอดำเนินการ",
    processing: "กำลังดำเนินการ",
  };

  // Accountant View - All Employees
  if (isAccountant) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">ตรวจสอบเงินเดือน - พนักงานทั้งหมด</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">จำนวนพนักงาน</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {allPayrollLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{allPayrollData?.length || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">พนักงานทั้งหมด</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เงินเดือนพื้นฐานรวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {allPayrollLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">฿{totals.totalBase.toLocaleString()}</div>
              )}
              <p className="text-xs text-muted-foreground">เงินเดือนพื้นฐานรายเดือน</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เงินเบี้ยเลี้ยงรวม</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {allPayrollLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-green-600">+฿{totals.totalAllowances.toLocaleString()}</div>
              )}
              <p className="text-xs text-muted-foreground">เงินช่วยเหลือทั้งหมด</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">การหักเงินรวม</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {allPayrollLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-red-600">-฿{totals.totalDeductions.toLocaleString()}</div>
              )}
              <p className="text-xs text-muted-foreground">ภาษี & ประกันสังคม</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เงินสุทธิรวม</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {allPayrollLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-primary">฿{totals.totalNet.toLocaleString()}</div>
              )}
              <p className="text-xs text-muted-foreground">ต้นทุนเงินเดือนทั้งหมด</p>
            </CardContent>
          </Card>
        </div>

        {/* Employee Payroll Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดเงินเดือนพนักงาน</CardTitle>
          </CardHeader>
          <CardContent>
            {allPayrollLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : allPayrollData && allPayrollData.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัสพนักงาน</TableHead>
                      <TableHead>ชื่อ</TableHead>
                      <TableHead className="text-right">เงินเดือนพื้นฐาน</TableHead>
                      <TableHead className="text-right">เงินเบี้ยเลี้ยง</TableHead>
                      <TableHead className="text-right">รายได้รวม</TableHead>
                      <TableHead className="text-right">หักเงิน</TableHead>
                      <TableHead className="text-right">เงินสุทธิ</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayrollData.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono">{emp.employeeId || "ไม่ระบุ"}</TableCell>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="text-right">฿{emp.baseSalary.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-600">+฿{emp.allowances.toLocaleString()}</TableCell>
                        <TableCell className="text-right">฿{emp.grossPay.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-red-600">-฿{emp.deductions.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">฿{emp.netPay.toLocaleString()}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              emp.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : emp.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {statusLabels[emp.status] || emp.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">ไม่มีข้อมูลเงินเดือน</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Employee View - Own Data
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
        <h1 className="text-2xl font-bold text-foreground">ตรวจสอบเงินเดือน</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เงินเดือนพื้นฐาน</CardTitle>
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
            <p className="text-xs text-muted-foreground">เงินเดือนพื้นฐานรายเดือน</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เงินช่วยเหลือ</CardTitle>
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
            <p className="text-xs text-muted-foreground">ค่าที่พัก, ค่าเดินทาง, อื่นๆ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หักเงิน</CardTitle>
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
            <p className="text-xs text-muted-foreground">ภาษี, ประกันสังคม</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เงินสุทธิ</CardTitle>
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
            <p className="text-xs text-muted-foreground">ยอดสลิปล่าสุด</p>
          </CardContent>
        </Card>
      </div>

      {/* Salary Details */}
      <Card>
        <CardHeader>
          <CardTitle>โครงสร้างเงินเดือนปัจจุบัน</CardTitle>
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
                  <p className="text-sm text-muted-foreground">เงินเดือนพื้นฐาน</p>
                  <p className="text-lg font-semibold">฿{Number(salary.base_salary).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ค่าที่พัก</p>
                  <p className="text-lg font-semibold">฿{Number(salary.housing_allowance).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ค่าเดินทาง</p>
                  <p className="text-lg font-semibold">฿{Number(salary.transport_allowance).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">เงินช่วยเหลืออื่นๆ</p>
                  <p className="text-lg font-semibold">฿{Number(salary.other_allowances).toLocaleString()}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">มีผลตั้งแต่</p>
                <p className="text-lg font-semibold">{new Date(salary.effective_date).toLocaleDateString("th-TH")}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">ไม่มีข้อมูลเงินเดือน กรุณาติดต่อฝ่ายบุคคล</p>
          )}
        </CardContent>
      </Card>

      {/* Latest Payslip Details */}
      {latestPayslip && (
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดสลิปล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">งวดการจ่าย</p>
                  <p className="font-semibold">
                    {new Date(latestPayslip.pay_period_start).toLocaleDateString("th-TH")} - {new Date(latestPayslip.pay_period_end).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">รายได้รวม</p>
                  <p className="font-semibold">฿{Number(latestPayslip.gross_pay).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ภาษี</p>
                  <p className="font-semibold text-red-600">-฿{Number(latestPayslip.tax_deduction || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ประกันสังคม</p>
                  <p className="font-semibold text-red-600">-฿{Number(latestPayslip.social_security || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">หักอื่นๆ</p>
                  <p className="font-semibold text-red-600">-฿{Number(latestPayslip.other_deductions || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">สถานะ</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    latestPayslip.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {statusLabels[latestPayslip.status] || latestPayslip.status}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="font-bold text-lg">เงินสุทธิ:</span>
                <span className="font-bold text-xl text-primary">฿{Number(latestPayslip.net_pay).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
