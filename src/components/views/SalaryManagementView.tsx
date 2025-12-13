import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Plus, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface SalaryData {
  id: string;
  user_id: string;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  effective_date: string;
  employee_id?: string;
  full_name?: string;
}

interface FormData {
  user_id: string;
  base_salary: string;
  housing_allowance: string;
  transport_allowance: string;
  other_allowances: string;
  effective_date: string;
}

export default function SalaryManagementView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    user_id: "",
    base_salary: "",
    housing_allowance: "0",
    transport_allowance: "0",
    other_allowances: "0",
    effective_date: format(new Date(), "yyyy-MM-dd"),
  });

  // Fetch all employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-salary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, employee_id")
        .order("employee_id");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all salaries with employee info
  const { data: salaries = [], isLoading } = useQuery({
    queryKey: ["salaries"],
    queryFn: async () => {
      const { data: salaryData, error } = await supabase
        .from("salaries")
        .select("*")
        .order("effective_date", { ascending: false });
      if (error) throw error;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, employee_id");

      return salaryData.map((salary) => {
        const profile = profiles?.find((p) => p.id === salary.user_id);
        return {
          ...salary,
          full_name: profile?.full_name || "ไม่ทราบชื่อ",
          employee_id: profile?.employee_id || "N/A",
        };
      }) as SalaryData[];
    },
  });

  // Get employees without salary records
  const employeesWithoutSalary = employees.filter(
    (emp) => !salaries.some((s) => s.user_id === emp.id)
  );

  const saveSalary = useMutation({
    mutationFn: async (data: FormData) => {
      const salaryRecord = {
        user_id: data.user_id,
        base_salary: parseFloat(data.base_salary) || 0,
        housing_allowance: parseFloat(data.housing_allowance) || 0,
        transport_allowance: parseFloat(data.transport_allowance) || 0,
        other_allowances: parseFloat(data.other_allowances) || 0,
        effective_date: data.effective_date,
      };

      if (editingId) {
        const { error } = await supabase
          .from("salaries")
          .update(salaryRecord)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("salaries").insert(salaryRecord);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      toast({
        title: editingId ? "อัปเดตเงินเดือนแล้ว" : "เพิ่มเงินเดือนแล้ว",
        description: `บันทึกข้อมูลเงินเดือน${editingId ? "อัปเดต" : "เพิ่ม"}สำเร็จ`,
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถบันทึกเงินเดือน: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (salary?: SalaryData) => {
    if (salary) {
      setEditingId(salary.id);
      setFormData({
        user_id: salary.user_id,
        base_salary: salary.base_salary.toString(),
        housing_allowance: salary.housing_allowance.toString(),
        transport_allowance: salary.transport_allowance.toString(),
        other_allowances: salary.other_allowances.toString(),
        effective_date: salary.effective_date,
      });
    } else {
      setEditingId(null);
      setFormData({
        user_id: "",
        base_salary: "",
        housing_allowance: "0",
        transport_allowance: "0",
        other_allowances: "0",
        effective_date: format(new Date(), "yyyy-MM-dd"),
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      user_id: "",
      base_salary: "",
      housing_allowance: "0",
      transport_allowance: "0",
      other_allowances: "0",
      effective_date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const handleSubmit = () => {
    if (!formData.user_id || !formData.base_salary) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณาเลือกพนักงานและกรอกเงินเดือนพื้นฐาน",
        variant: "destructive",
      });
      return;
    }
    saveSalary.mutate(formData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const calculateTotal = (salary: SalaryData) => {
    return (
      salary.base_salary +
      salary.housing_allowance +
      salary.transport_allowance +
      salary.other_allowances
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            จัดการเงินเดือน
          </CardTitle>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มเงินเดือน
          </Button>
        </CardHeader>
        <CardContent>
          {employeesWithoutSalary.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>{employeesWithoutSalary.length}</strong> พนักงานยังไม่มีข้อมูลเงินเดือน:{" "}
                {employeesWithoutSalary.map((e) => e.employee_id).join(", ")}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
          ) : salaries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ไม่พบข้อมูลเงินเดือน กด "เพิ่มเงินเดือน" เพื่อสร้างรายการใหม่
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสพนักงาน</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead className="text-right">เงินเดือนพื้นฐาน</TableHead>
                  <TableHead className="text-right">ค่าที่พัก</TableHead>
                  <TableHead className="text-right">ค่าเดินทาง</TableHead>
                  <TableHead className="text-right">อื่นๆ</TableHead>
                  <TableHead className="text-right">รวมทั้งหมด</TableHead>
                  <TableHead>วันที่มีผล</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell className="font-medium">{salary.employee_id}</TableCell>
                    <TableCell>{salary.full_name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(salary.base_salary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(salary.housing_allowance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(salary.transport_allowance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(salary.other_allowances)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(calculateTotal(salary))}
                    </TableCell>
                    <TableCell>{format(new Date(salary.effective_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(salary)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "แก้ไขเงินเดือน" : "เพิ่มเงินเดือนใหม่"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>พนักงาน</Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, user_id: value })
                }
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกพนักงาน" />
                </SelectTrigger>
                <SelectContent>
                  {(editingId ? employees : employeesWithoutSalary).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.employee_id} - {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>เงินเดือนพื้นฐาน (บาท)</Label>
              <Input
                type="number"
                value={formData.base_salary}
                onChange={(e) =>
                  setFormData({ ...formData, base_salary: e.target.value })
                }
                placeholder="กรอกเงินเดือนพื้นฐาน"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ค่าที่พัก</Label>
                <Input
                  type="number"
                  value={formData.housing_allowance}
                  onChange={(e) =>
                    setFormData({ ...formData, housing_allowance: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ค่าเดินทาง</Label>
                <Input
                  type="number"
                  value={formData.transport_allowance}
                  onChange={(e) =>
                    setFormData({ ...formData, transport_allowance: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>เบี้ยเลี้ยงอื่นๆ</Label>
              <Input
                type="number"
                value={formData.other_allowances}
                onChange={(e) =>
                  setFormData({ ...formData, other_allowances: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>วันที่มีผล</Label>
              <Input
                type="date"
                value={formData.effective_date}
                onChange={(e) =>
                  setFormData({ ...formData, effective_date: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              ยกเลิก
            </Button>
            <Button onClick={handleSubmit} disabled={saveSalary.isPending}>
              {saveSalary.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
