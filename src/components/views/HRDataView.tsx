import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Inbox, Users, Clock, DollarSign, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { th } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export function HRDataView() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(currentDate, i);
    return { value: format(date, "yyyy-MM"), label: format(date, "MMMM yyyy", { locale: th }) };
  });

  const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
  const monthEnd = endOfMonth(new Date(selectedMonth + "-01"));

  // Fetch payslips for the selected month (HR submitted data)
  const { data: payslips, isLoading: payslipsLoading } = useQuery({
    queryKey: ["hr-data-payslips", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslips")
        .select("*")
        .gte("pay_period_start", format(monthStart, "yyyy-MM-dd"))
        .lte("pay_period_end", format(monthEnd, "yyyy-MM-dd"))
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles to get employee names
  const { data: profiles } = useQuery({
    queryKey: ["all-profiles-hr-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, employee_id");
      if (error) throw error;
      return data || [];
    },
  });

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  // Filter pending payslips (data from HR)
  const pendingPayslips = payslips?.filter((p) => p.status === "pending") || [];

  // Calculate summary
  const totalEmployees = pendingPayslips.length;
  const totalOTPay = pendingPayslips.reduce((sum, p) => sum + Number(p.overtime_pay || 0), 0);
  const totalBonus = pendingPayslips.reduce((sum, p) => sum + Number(p.bonus || 0), 0);
  const totalCommission = pendingPayslips.reduce((sum, p) => sum + Number(p.commission || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">ข้อมูลจากฝ่าย HR</h1>
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              จำนวนพนักงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees} คน</div>
            <p className="text-xs text-muted-foreground">รอดำเนินการคำนวณ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              รวมค่าล่วงเวลา
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">฿{totalOTPay.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="h-4 w-4" />
              รวมโบนัส
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">฿{totalBonus.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              รวมคอมมิชชั่น
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">฿{totalCommission.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลเงินเดือนที่ได้รับจาก HR - {format(monthStart, "MMMM yyyy", { locale: th })}</CardTitle>
        </CardHeader>
        <CardContent>
          {payslipsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pendingPayslips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสพนักงาน</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead className="text-right">เงินเดือนพื้นฐาน</TableHead>
                  <TableHead className="text-right">เบี้ยเลี้ยง</TableHead>
                  <TableHead className="text-right">ค่าล่วงเวลา</TableHead>
                  <TableHead className="text-right">โบนัส</TableHead>
                  <TableHead className="text-right">คอมมิชชั่น</TableHead>
                  <TableHead className="text-right">รวมรายได้</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayslips.map((payslip) => {
                  const profile = profileMap.get(payslip.user_id);
                  const totalIncome =
                    Number(payslip.base_salary) +
                    Number(payslip.allowances || 0) +
                    Number(payslip.overtime_pay || 0) +
                    Number(payslip.bonus || 0) +
                    Number(payslip.commission || 0);
                  return (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-mono">{profile?.employee_id || "-"}</TableCell>
                      <TableCell>{profile?.full_name || "ไม่ทราบชื่อ"}</TableCell>
                      <TableCell className="text-right">฿{Number(payslip.base_salary).toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{Number(payslip.allowances || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-blue-600">
                        ฿{Number(payslip.overtime_pay || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ฿{Number(payslip.bonus || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        ฿{Number(payslip.commission || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">฿{totalIncome.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          รอคำนวณ
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">ยังไม่มีข้อมูลจาก HR ในเดือนนี้</p>
              <p className="text-sm text-muted-foreground mt-1">รอให้ฝ่าย HR ส่งรายงานประจำเดือนมา</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
