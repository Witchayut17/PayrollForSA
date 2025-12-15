import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, Printer, Building2, PieChart, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { th } from "date-fns/locale";

export function FinanceReportView() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(currentDate, i);
    return { value: format(date, "yyyy-MM"), label: format(date, "MMMM yyyy", { locale: th }) };
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

  // Calculate company-level financial summaries
  const totalBaseSalaries = payslips?.reduce((sum, p) => sum + Number(p.base_salary), 0) || 0;
  const totalAllowances = payslips?.reduce((sum, p) => sum + Number(p.allowances || 0), 0) || 0;
  const totalOvertimePay = payslips?.reduce((sum, p) => sum + Number(p.overtime_pay || 0), 0) || 0;
  const totalBonus = payslips?.reduce((sum, p) => sum + Number(p.bonus || 0), 0) || 0;
  const totalCommission = payslips?.reduce((sum, p) => sum + Number(p.commission || 0), 0) || 0;
  const totalGrossPay = payslips?.reduce((sum, p) => sum + Number(p.gross_pay), 0) || 0;
  
  const totalSocialSecurity = payslips?.reduce((sum, p) => sum + Number(p.social_security || 0), 0) || 0;
  const totalOtherDeductions = payslips?.reduce((sum, p) => sum + Number(p.other_deductions || 0), 0) || 0;
  const totalDeductions = totalSocialSecurity + totalOtherDeductions;
  const totalNetPay = payslips?.reduce((sum, p) => sum + Number(p.net_pay), 0) || 0;

  const employeeCount = payslips?.length || 0;
  const paidCount = payslips?.filter(p => p.status === "paid").length || 0;
  const pendingCount = employeeCount - paidCount;

  // Company expense categories for the report
  const expenseCategories = [
    { name: "เงินเดือนพื้นฐาน", amount: totalBaseSalaries, percentage: totalGrossPay > 0 ? (totalBaseSalaries / totalGrossPay * 100).toFixed(1) : 0 },
    { name: "เบี้ยเลี้ยง", amount: totalAllowances, percentage: totalGrossPay > 0 ? (totalAllowances / totalGrossPay * 100).toFixed(1) : 0 },
    { name: "ค่าล่วงเวลา", amount: totalOvertimePay, percentage: totalGrossPay > 0 ? (totalOvertimePay / totalGrossPay * 100).toFixed(1) : 0 },
    { name: "โบนัส", amount: totalBonus, percentage: totalGrossPay > 0 ? (totalBonus / totalGrossPay * 100).toFixed(1) : 0 },
    { name: "คอมมิชชั่น", amount: totalCommission, percentage: totalGrossPay > 0 ? (totalCommission / totalGrossPay * 100).toFixed(1) : 0 },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const reportData = [
      ["รายงานการเงินบริษัท", format(monthStart, "MMMM yyyy", { locale: th })],
      [""],
      ["สรุปรายได้"],
      ["หมวดหมู่", "จำนวนเงิน (บาท)", "% ของรวม"],
      ...expenseCategories.map(cat => [cat.name, cat.amount.toString(), `${cat.percentage}%`]),
      ["รวมเงินเดือนทั้งหมด", totalGrossPay.toString(), "100%"],
      [""],
      ["สรุปการหักเงิน"],
      ["ประกันสังคม", totalSocialSecurity.toString()],
      ["หักอื่นๆ", totalOtherDeductions.toString()],
      ["รวมการหักเงิน", totalDeductions.toString()],
      [""],
      ["ยอดจ่ายสุทธิ", totalNetPay.toString()],
      [""],
      ["สรุปบุคลากร"],
      ["จำนวนพนักงานทั้งหมด", employeeCount.toString()],
      ["จ่ายแล้ว", paidCount.toString()],
      ["รอดำเนินการ", pendingCount.toString()],
    ];

    const csvContent = reportData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `รายงานการเงิน-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">รายงานการเงินบริษัท</h1>
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
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก CSV
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            พิมพ์
          </Button>
        </div>
      </div>

      {/* Company Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค่าใช้จ่ายเงินเดือนรวม</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">฿{totalGrossPay.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">ค่าใช้จ่ายเงินเดือนรวม</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การหักเงินรวม</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">฿{totalDeductions.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">ประกันสังคมและอื่นๆ</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดจ่ายสุทธิ</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-primary">฿{totalNetPay.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">ยอดจ่ายจริง</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บุคลากร</CardTitle>
            <PieChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{employeeCount} คน</div>
            )}
            <p className="text-xs text-muted-foreground">
              จ่ายแล้ว {paidCount} / รอดำเนินการ {pendingCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Company Income & Expense Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              รายละเอียดค่าใช้จ่ายเงินเดือน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseCategories.map((cat) => (
                  <TableRow key={cat.name}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell className="text-right">฿{cat.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{cat.percentage}%</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>รวมเงินเดือนทั้งหมด</TableCell>
                  <TableCell className="text-right text-green-600">฿{totalGrossPay.toLocaleString()}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              การหักเงินตามกฎหมาย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ประเภทการหัก</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>เงินสมทบประกันสังคม</TableCell>
                  <TableCell className="text-right">฿{totalSocialSecurity.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>หักอื่นๆ</TableCell>
                  <TableCell className="text-right">฿{totalOtherDeductions.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>รวมการหักเงิน</TableCell>
                  <TableCell className="text-right text-red-600">฿{totalDeductions.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปการเงินประจำเดือน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-sm text-muted-foreground">ค่าใช้จ่ายเงินเดือนรวม</p>
              <p className="text-3xl font-bold text-green-600">฿{totalGrossPay.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">ค่าตอบแทนรวมทั้งหมด</p>
            </div>
            <div className="space-y-2 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <p className="text-sm text-muted-foreground">ภาระผูกพันตามกฎหมาย</p>
              <p className="text-3xl font-bold text-red-600">฿{totalDeductions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">ประกันสังคมและหักอื่นๆ</p>
            </div>
            <div className="space-y-2 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">กระแสเงินสดจ่ายสุทธิ</p>
              <p className="text-3xl font-bold text-primary">฿{totalNetPay.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">ยอดจ่ายพนักงาน</p>
            </div>
          </div>

          {payslips && payslips.length === 0 && (
            <p className="text-center text-muted-foreground py-8 mt-4">
              ไม่มีข้อมูลเงินเดือนสำหรับเดือน {format(monthStart, "MMMM yyyy", { locale: th })}
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
