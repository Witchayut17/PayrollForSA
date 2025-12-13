import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Printer, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";

interface EmployeeReportData {
  id: string;
  employee_id: string;
  full_name: string;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  ot_hours: number;
  bonus: number;
  commission: number;
  payslip_id: string | null;
}

export function HRReportView() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));
  const [editingEmployee, setEditingEmployee] = useState<EmployeeReportData | null>(null);
  const [bonusValue, setBonusValue] = useState("");
  const [commissionValue, setCommissionValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(new Date(selectedMonth));
  const monthEnd = endOfMonth(new Date(selectedMonth));
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const workingDays = monthDays.filter((d) => !isWeekend(d)).length;

  const { data: employees = [] } = useQuery({
    queryKey: ["all-employees-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, employee_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance-report", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .gte("attendance_date", format(monthStart, "yyyy-MM-dd"))
        .lte("attendance_date", format(monthEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ["leave-report", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("status", "approved")
        .gte("start_date", format(monthStart, "yyyy-MM-dd"))
        .lte("end_date", format(monthEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
  });

  const { data: otRequests = [] } = useQuery({
    queryKey: ["ot-report", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ot_requests")
        .select("*")
        .eq("status", "approved")
        .gte("request_date", format(monthStart, "yyyy-MM-dd"))
        .lte("request_date", format(monthEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
  });

  const { data: payslips = [] } = useQuery({
    queryKey: ["payslips-report", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslips")
        .select("*")
        .gte("pay_period_start", format(monthStart, "yyyy-MM-dd"))
        .lte("pay_period_end", format(monthEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
  });

  // Calculate report data
  const reportData: EmployeeReportData[] = employees.map((emp) => {
    const empAttendance = attendance.filter((a) => a.user_id === emp.id);
    const empLeaves = leaveRequests.filter((l) => l.user_id === emp.id);
    const empOT = otRequests.filter((o) => o.user_id === emp.id);
    const empPayslip = payslips.find((p) => p.user_id === emp.id);

    // Calculate leave days
    let totalLeaveDays = 0;
    empLeaves.forEach((leave) => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const days = eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d)).length;
      totalLeaveDays += days;
    });

    return {
      id: emp.id,
      employee_id: emp.employee_id || "-",
      full_name: emp.full_name || "Unknown",
      present_days: empAttendance.filter((a) => a.status === "present").length,
      absent_days: empAttendance.filter((a) => a.status === "absent").length,
      late_days: empAttendance.filter((a) => a.status === "late").length,
      leave_days: totalLeaveDays,
      ot_hours: empOT.reduce((sum, o) => sum + Number(o.hours), 0),
      bonus: Number(empPayslip?.bonus || 0),
      commission: Number(empPayslip?.commission || 0),
      payslip_id: empPayslip?.id || null,
    };
  });

  const handleEditClick = (emp: EmployeeReportData) => {
    setEditingEmployee(emp);
    setBonusValue(emp.bonus.toString());
    setCommissionValue(emp.commission.toString());
  };

  const handleSave = async () => {
    if (!editingEmployee) return;

    setIsSaving(true);
    try {
      const bonus = parseFloat(bonusValue) || 0;
      const commission = parseFloat(commissionValue) || 0;

      if (editingEmployee.payslip_id) {
        // Update existing payslip
        const { error } = await supabase
          .from("payslips")
          .update({ bonus, commission })
          .eq("id", editingEmployee.payslip_id);

        if (error) throw error;
      } else {
        // Get salary info first
        const { data: salaryData } = await supabase
          .from("salaries")
          .select("*")
          .eq("user_id", editingEmployee.id)
          .order("effective_date", { ascending: false })
          .limit(1)
          .single();

        const baseSalary = salaryData?.base_salary || 0;
        const allowances = (salaryData?.housing_allowance || 0) + 
                          (salaryData?.transport_allowance || 0) + 
                          (salaryData?.other_allowances || 0);

        // Create new payslip with bonus/commission
        const { error } = await supabase.from("payslips").insert({
          user_id: editingEmployee.id,
          pay_period_start: format(monthStart, "yyyy-MM-dd"),
          pay_period_end: format(monthEnd, "yyyy-MM-dd"),
          base_salary: baseSalary,
          allowances,
          bonus,
          commission,
          gross_pay: baseSalary + allowances + bonus + commission,
          net_pay: baseSalary + allowances + bonus + commission,
          status: "pending",
        });

        if (error) throw error;
      }

      toast.success("Bonus and commission updated successfully");
      queryClient.invalidateQueries({ queryKey: ["payslips-report", selectedMonth] });
      setEditingEmployee(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>HR Report - ${format(monthStart, "MMMM yyyy")}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 10px; }
          h2 { text-align: center; color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f4f4f4; font-weight: bold; }
          tr:nth-child(even) { background-color: #fafafa; }
          .summary { margin-top: 30px; font-size: 14px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <h1>Monthly HR Report</h1>
        <h2>${format(monthStart, "MMMM yyyy")}</h2>
        <p>Working Days: ${workingDays} | Generated: ${format(new Date(), "MMMM d, yyyy HH:mm")}</p>
        
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Leave Days</th>
              <th>OT Hours</th>
              <th>Bonus</th>
              <th>Commission</th>
            </tr>
          </thead>
          <tbody>
            ${reportData
              .map(
                (emp) => `
              <tr>
                <td>${emp.employee_id}</td>
                <td>${emp.full_name}</td>
                <td>${emp.present_days}</td>
                <td>${emp.absent_days}</td>
                <td>${emp.late_days}</td>
                <td>${emp.leave_days}</td>
                <td>${emp.ot_hours}</td>
                <td>฿${emp.bonus.toLocaleString()}</td>
                <td>฿${emp.commission.toLocaleString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="summary">
          <p><strong>Summary:</strong></p>
          <p>Total Employees: ${reportData.length}</p>
          <p>Total OT Hours: ${reportData.reduce((sum, e) => sum + e.ot_hours, 0)}</p>
          <p>Total Bonus: ฿${reportData.reduce((sum, e) => sum + e.bonus, 0).toLocaleString()}</p>
          <p>Total Commission: ฿${reportData.reduce((sum, e) => sum + e.commission, 0).toLocaleString()}</p>
        </div>
        
        <div class="footer">
          <p>This report is for internal use by the Accounting department</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } else {
      toast.error("Please allow popups to print the report");
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), i, 1);
    return { value: format(date, "yyyy-MM"), label: format(date, "MMMM yyyy") };
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            HR Monthly Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Select Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generatePDF}>
              <Printer className="h-4 w-4 mr-2" />
              Print / Save as PDF
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Working days in {format(monthStart, "MMMM yyyy")}: <strong>{workingDays}</strong>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Late</TableHead>
                  <TableHead className="text-center">Leave</TableHead>
                  <TableHead className="text-center">OT Hours</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono">{emp.employee_id}</TableCell>
                    <TableCell>{emp.full_name}</TableCell>
                    <TableCell className="text-center">{emp.present_days}</TableCell>
                    <TableCell className="text-center">{emp.absent_days}</TableCell>
                    <TableCell className="text-center">{emp.late_days}</TableCell>
                    <TableCell className="text-center">{emp.leave_days}</TableCell>
                    <TableCell className="text-center">{emp.ot_hours}</TableCell>
                    <TableCell className="text-right">฿{emp.bonus.toLocaleString()}</TableCell>
                    <TableCell className="text-right">฿{emp.commission.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(emp)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {reportData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Employees</p>
                  <p className="text-xl font-bold">{reportData.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total OT Hours</p>
                  <p className="text-xl font-bold">{reportData.reduce((sum, e) => sum + e.ot_hours, 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Bonus</p>
                  <p className="text-xl font-bold">฿{reportData.reduce((sum, e) => sum + e.bonus, 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Commission</p>
                  <p className="text-xl font-bold">฿{reportData.reduce((sum, e) => sum + e.commission, 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Edit Bonus/Commission Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bonus & Commission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Employee</p>
              <p className="font-medium">{editingEmployee?.full_name} ({editingEmployee?.employee_id})</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="font-medium">{format(monthStart, "MMMM yyyy")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus">Bonus (฿)</Label>
              <Input
                id="bonus"
                type="number"
                value={bonusValue}
                onChange={(e) => setBonusValue(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">Commission (฿)</Label>
              <Input
                id="commission"
                type="number"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEmployee(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
