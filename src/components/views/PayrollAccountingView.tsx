import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Send, Check, Download, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export function PayrollAccountingView() {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));
  const [selectedPayslips, setSelectedPayslips] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(currentDate, i);
    return { value: format(date, "yyyy-MM"), label: format(date, "MMMM yyyy") };
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
      toast.success("Payroll processed successfully! Payments have been marked as paid.");
    },
    onError: (error) => {
      toast.error("Failed to process payroll: " + error.message);
    },
  });

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
      toast.error("Please select at least one payslip to process.");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleExportBankFile = () => {
    const selectedData = payslips?.filter((p) => selectedPayslips.includes(p.id));
    if (!selectedData || selectedData.length === 0) {
      toast.error("Please select payslips to export.");
      return;
    }

    const bankData = selectedData.map((payslip) => {
      const profile = profileMap.get(payslip.user_id);
      return {
        employee_id: profile?.employee_id || "",
        employee_name: profile?.full_name || "",
        bank_name: profile?.bank_name || "",
        bank_account_number: profile?.bank_account_number || "",
        net_pay: Number(payslip.net_pay),
        pay_period: `${payslip.pay_period_start} to ${payslip.pay_period_end}`,
      };
    });

    const csv = [
      "Employee ID,Employee Name,Bank Name,Bank Account Number,Net Pay,Pay Period",
      ...bankData.map((row) => 
        `${row.employee_id},"${row.employee_name}","${row.bank_name}","${row.bank_account_number}",${row.net_pay},"${row.pay_period}"`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bank-transfer-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Bank transfer file exported successfully!");
  };

  // Get selected payslips details for confirmation dialog
  const selectedPayslipsDetails = payslips?.filter((p) => selectedPayslips.includes(p.id)) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Payroll Accounting</h1>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayslips.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: ฿{pendingPayslips.reduce((sum, p) => sum + Number(p.net_pay), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidPayslips.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: ฿{paidPayslips.reduce((sum, p) => sum + Number(p.net_pay), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Selected for Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{selectedPayslips.length}</div>
            <p className="text-xs text-muted-foreground">Total: ฿{selectedTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payroll Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Payroll</CardTitle>
          <div className="flex gap-2">
            <Button onClick={selectAllPending} variant="outline" size="sm">
              Select All
            </Button>
            <Button onClick={clearSelection} variant="outline" size="sm">
              Clear
            </Button>
            <Button onClick={handleExportBankFile} variant="outline" size="sm" disabled={selectedPayslips.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Bank File
            </Button>
            <Button onClick={handleProcessPayroll} disabled={selectedPayslips.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              Process Selected
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
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Bank Account</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
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
                          <p className="font-medium">{profile?.full_name || "Unknown"}</p>
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
                          <span className="text-xs text-destructive">No bank info</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(payslip.pay_period_start), "MMM d")} -{" "}
                        {format(new Date(payslip.pay_period_end), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">฿{Number(payslip.gross_pay).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">-฿{totalDeductions.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        ฿{Number(payslip.net_pay).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No pending payroll for this month.</p>
          )}
        </CardContent>
      </Card>

      {/* Processed Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Processed Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paidPayslips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Bank Account</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Paid At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidPayslips.map((payslip) => {
                  const profile = profileMap.get(payslip.user_id);
                  return (
                    <TableRow key={payslip.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{profile?.full_name || "Unknown"}</p>
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
                        {format(new Date(payslip.pay_period_start), "MMM d")} -{" "}
                        {format(new Date(payslip.pay_period_end), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ฿{Number(payslip.net_pay).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {payslip.paid_at ? format(new Date(payslip.paid_at), "MMM d, yyyy HH:mm") : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No processed payments for this month.</p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Payroll Processing</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">You are about to process payment for the following employees:</p>
            <div className="max-h-64 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPayslipsDetails.map((payslip) => {
                    const profile = profileMap.get(payslip.user_id);
                    return (
                      <TableRow key={payslip.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{profile?.full_name || "Unknown"}</p>
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
                            <span className="text-xs text-destructive">No bank info</span>
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
                <strong>Total employees:</strong> {selectedPayslips.length}
              </p>
              <p>
                <strong>Total amount:</strong> ฿{selectedTotal.toLocaleString()}
              </p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              This action will mark the selected payslips as paid and cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => processPaymentMutation.mutate(selectedPayslips)}
              disabled={processPaymentMutation.isPending}
            >
              {processPaymentMutation.isPending ? "Processing..." : "Confirm & Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
