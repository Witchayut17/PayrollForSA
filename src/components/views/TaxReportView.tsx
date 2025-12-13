import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Printer, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { th } from "date-fns/locale";

export function TaxReportView() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(currentDate, i);
    return { value: format(date, "yyyy-MM"), label: format(date, "MMMM yyyy", { locale: th }) };
  });

  const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
  const monthEnd = endOfMonth(new Date(selectedMonth + "-01"));

  const { data: payslips, isLoading } = useQuery({
    queryKey: ["tax-payslips", selectedMonth],
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

  // Calculate totals
  const totalTax = payslips?.reduce((sum, p) => sum + Number(p.tax_deduction || 0), 0) || 0;
  const totalSocialSecurity = payslips?.reduce((sum, p) => sum + Number(p.social_security || 0), 0) || 0;
  const totalGrossPay = payslips?.reduce((sum, p) => sum + Number(p.gross_pay), 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const reportData = payslips?.map((payslip) => {
      const profile = profileMap.get(payslip.user_id);
      return {
        "รหัสพนักงาน": profile?.employee_id || "",
        "ชื่อ-นามสกุล": profile?.full_name || "",
        "รายรับรวม": Number(payslip.gross_pay),
        "หักภาษี": Number(payslip.tax_deduction || 0),
        "ประกันสังคม": Number(payslip.social_security || 0),
        "รวมการหัก": Number(payslip.tax_deduction || 0) + Number(payslip.social_security || 0),
      };
    });

    const csv = [
      Object.keys(reportData?.[0] || {}).join(","),
      ...(reportData?.map((row) => Object.values(row).join(",")) || []),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `รายงานภาษี-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">รายงานภาษีและประกันสังคม</h1>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายได้รวมที่ต้องเสียภาษี</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">฿{totalGrossPay.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ภาษีหัก ณ ที่จ่ายรวม</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600">฿{totalTax.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              อัตราที่แท้จริง: {totalGrossPay > 0 ? ((totalTax / totalGrossPay) * 100).toFixed(2) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">เงินสมทบประกันสังคมรวม</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">฿{totalSocialSecurity.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">ส่วนสมทบพนักงาน</p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดภาษีและประกันสังคมรายบุคคล</CardTitle>
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
                  <TableHead>รหัสพนักงาน</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead className="text-right">รายรับรวม</TableHead>
                  <TableHead className="text-right">หักภาษี</TableHead>
                  <TableHead className="text-right">ประกันสังคม</TableHead>
                  <TableHead className="text-right">รวมการหักตามกฎหมาย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => {
                  const profile = profileMap.get(payslip.user_id);
                  const totalStatutory = Number(payslip.tax_deduction || 0) + Number(payslip.social_security || 0);
                  return (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-mono">{profile?.employee_id || "-"}</TableCell>
                      <TableCell className="font-medium">{profile?.full_name || "ไม่ทราบชื่อ"}</TableCell>
                      <TableCell className="text-right">฿{Number(payslip.gross_pay).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">
                        ฿{Number(payslip.tax_deduction || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ฿{Number(payslip.social_security || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ฿{totalStatutory.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2}>รวมทั้งหมด</TableCell>
                  <TableCell className="text-right">฿{totalGrossPay.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">฿{totalTax.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-blue-600">฿{totalSocialSecurity.toLocaleString()}</TableCell>
                  <TableCell className="text-right">฿{(totalTax + totalSocialSecurity).toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูลภาษีสำหรับเดือนนี้</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
