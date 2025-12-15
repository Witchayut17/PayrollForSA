import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Send, Check, Building2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { th } from "date-fns/locale";

export function PayrollAccountingView() {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));
  const [selectedPayslips, setSelectedPayslips] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [payslipToDelete, setPayslipToDelete] = useState<string | null>(null);

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(currentDate, i);
    return { value: format(date, "yyyy-MM"), label: format(date, "MMMM yyyy", { locale: th }) };
  });

  const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
  const monthEnd = endOfMonth(new Date(selectedMonth + "-01"));

  const { data: payslips, isLoading } = useQuery({
    queryKey: ["payroll-accounting", selectedMonth],
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

  const { data: profiles } = useQuery({
    queryKey: ["all-profiles-with-bank"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, employee_id, bank_name, bank_account_number");
      if (error) throw error;
      return data || [];
    },
  });

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  const processPaymentMutation = useMutation({
    mutationFn: async (payslipIds: string[]) => {
      const { error } = await supabase
        .from("payslips")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .in("id", payslipIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-accounting"] });
      setSelectedPayslips([]);
      setShowConfirmDialog(false);
      toast.success("ประมวลผลเงินเดือนสำเร็จ! การจ่ายเงินถูกบันทึกเรียบร้อยแล้ว");
    },
    onError: (error) => {
      toast.error("ไม่สามารถประมวลผลเงินเดือนได้: " + error.message);
    },
  });

  const deletePayslipMutation = useMutation({
    mutationFn: async (payslipId: string) => {
      const { error } = await supabase
        .from("payslips")
        .delete()
        .eq("id", payslipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-accounting"] });
      setShowDeleteDialog(false);
      setPayslipToDelete(null);
      toast.success("ลบรายการเงินเดือนสำเร็จ");
    },
    onError: (error) => {
      toast.error("ไม่สามารถลบรายการได้: " + error.message);
    },
  });

  const handleDeletePayslip = (id: string) => {
    setPayslipToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (payslipToDelete) {
      deletePayslipMutation.mutate(payslipToDelete);
    }
  };

  const pendingPayslips = payslips?.filter((p) => p.status === "pending") || [];
  const paidPayslips = payslips?.filter((p) => p.status === "paid") || [];

  const toggleSelect = (id: string) => {
    setSelectedPayslips((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAllPending = () => {
    setSelectedPayslips(pendingPayslips.map((p) => p.id));
  };

  const clearSelection = () => {
    setSelectedPayslips([]);
  };

  const selectedTotal = payslips
    ?.filter((p) => selectedPayslips.includes(p.id))
    .reduce((sum, p) => sum + Number(p.net_pay), 0) || 0;

  const handleProcessPayroll = () => {
    if (selectedPayslips.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อยหนึ่งสลิปเงินเดือนเพื่อประมวลผล");
      return;
    }
    setShowConfirmDialog(true);
  };


  // Get selected payslips details for confirmation dialog
  const selectedPayslipsDetails = payslips?.filter((p) => selectedPayslips.includes(p.id)) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">บัญชีเงินเดือน</h1>
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">รอจ่ายเงิน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayslips.length} รายการ</div>
            <p className="text-xs text-muted-foreground">
              รวม: ฿{pendingPayslips.reduce((sum, p) => sum + Number(p.net_pay), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">จ่ายเงินแล้ว</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidPayslips.length} รายการ</div>
            <p className="text-xs text-muted-foreground">
              รวม: ฿{paidPayslips.reduce((sum, p) => sum + Number(p.net_pay), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">เลือกเพื่อประมวลผล</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{selectedPayslips.length} รายการ</div>
            <p className="text-xs text-muted-foreground">รวม: ฿{selectedTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payroll Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>รายการเงินเดือนรอจ่าย</CardTitle>
          <div className="flex gap-2">
            <Button onClick={selectAllPending} variant="outline" size="sm">
              เลือกทั้งหมด
            </Button>
            <Button onClick={clearSelection} variant="outline" size="sm">
              ล้างการเลือก
            </Button>
            <Button onClick={handleProcessPayroll} disabled={selectedPayslips.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              ประมวลผลที่เลือก
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pendingPayslips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">เลือก</TableHead>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>บัญชีธนาคาร</TableHead>
                  <TableHead>งวดการจ่าย</TableHead>
                  <TableHead className="text-right">เงินรวม</TableHead>
                  <TableHead className="text-right">หักเงิน</TableHead>
                  <TableHead className="text-right">เงินสุทธิ</TableHead>
                  <TableHead className="w-12">ลบ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayslips.map((payslip) => {
                  const profile = profileMap.get(payslip.user_id);
                  const totalDeductions =
                    Number(payslip.tax_deduction || 0) +
                    Number(payslip.social_security || 0) +
                    Number(payslip.other_deductions || 0);
                  return (
                    <TableRow key={payslip.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPayslips.includes(payslip.id)}
                          onCheckedChange={() => toggleSelect(payslip.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{profile?.full_name || "ไม่ทราบชื่อ"}</p>
                          <p className="text-xs text-muted-foreground">{profile?.employee_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile?.bank_name && profile?.bank_account_number ? (
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{profile.bank_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{profile.bank_account_number}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-destructive">ไม่มีข้อมูลธนาคาร</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(payslip.pay_period_start), "d MMM", { locale: th })} -{" "}
                        {format(new Date(payslip.pay_period_end), "d MMM yyyy", { locale: th })}
                      </TableCell>
                      <TableCell className="text-right">฿{Number(payslip.gross_pay).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">-฿{totalDeductions.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        ฿{Number(payslip.net_pay).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeletePayslip(payslip.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">ไม่มีรายการเงินเดือนรอจ่ายในเดือนนี้</p>
          )}
        </CardContent>
      </Card>

      {/* Processed Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            รายการที่จ่ายเงินแล้ว
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paidPayslips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>บัญชีธนาคาร</TableHead>
                  <TableHead>งวดการจ่าย</TableHead>
                  <TableHead className="text-right">เงินสุทธิ</TableHead>
                  <TableHead>จ่ายเมื่อ</TableHead>
                  <TableHead className="w-12">ลบ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidPayslips.map((payslip) => {
                  const profile = profileMap.get(payslip.user_id);
                  return (
                    <TableRow key={payslip.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{profile?.full_name || "ไม่ทราบชื่อ"}</p>
                          <p className="text-xs text-muted-foreground">{profile?.employee_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile?.bank_name && profile?.bank_account_number ? (
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{profile.bank_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{profile.bank_account_number}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(payslip.pay_period_start), "d MMM", { locale: th })} -{" "}
                        {format(new Date(payslip.pay_period_end), "d MMM yyyy", { locale: th })}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ฿{Number(payslip.net_pay).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {payslip.paid_at ? format(new Date(payslip.paid_at), "d MMM yyyy HH:mm", { locale: th }) : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeletePayslip(payslip.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">ไม่มีรายการที่จ่ายเงินแล้วในเดือนนี้</p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ยืนยันการประมวลผลเงินเดือน</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">คุณกำลังจะประมวลผลการจ่ายเงินสำหรับพนักงานต่อไปนี้:</p>
            <div className="max-h-64 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>บัญชีธนาคาร</TableHead>
                    <TableHead className="text-right">เงินสุทธิ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPayslipsDetails.map((payslip) => {
                    const profile = profileMap.get(payslip.user_id);
                    return (
                      <TableRow key={payslip.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{profile?.full_name || "ไม่ทราบชื่อ"}</p>
                            <p className="text-xs text-muted-foreground">{profile?.employee_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {profile?.bank_name && profile?.bank_account_number ? (
                            <div>
                              <p className="text-sm">{profile.bank_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{profile.bank_account_number}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-destructive">ไม่มีข้อมูลธนาคาร</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ฿{Number(payslip.net_pay).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="bg-muted p-4 rounded-lg mt-4 space-y-2">
              <p>
                <strong>จำนวนพนักงานทั้งหมด:</strong> {selectedPayslips.length} คน
              </p>
              <p>
                <strong>ยอดรวมทั้งหมด:</strong> ฿{selectedTotal.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={() => processPaymentMutation.mutate(selectedPayslips)} disabled={processPaymentMutation.isPending}>
              {processPaymentMutation.isPending ? "กำลังประมวลผล..." : "ยืนยันและประมวลผล"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบรายการ</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>คุณต้องการลบรายการเงินเดือนนี้ใช่หรือไม่?</p>
            <p className="text-sm text-muted-foreground mt-2">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={deletePayslipMutation.isPending}
            >
              {deletePayslipMutation.isPending ? "กำลังลบ..." : "ยืนยันการลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
