import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Download, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface Payslip {
  id: string;
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  allowances: number;
  overtime_pay: number;
  gross_pay: number;
  tax_deduction: number;
  social_security: number;
  other_deductions: number;
  net_pay: number;
  status: string;
  generated_at: string;
  paid_at: string | null;
}

export function PayrollHistoryView() {
  const { user } = useAuth();
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const { data: payslips, isLoading } = useQuery({
    queryKey: ["payslips", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslips")
        .select("*")
        .eq("user_id", user!.id)
        .order("pay_period_end", { ascending: false });
      
      if (error) throw error;
      return data as Payslip[];
    },
    enabled: !!user?.id,
  });

  const handleDownload = (payslip: Payslip) => {
    const content = `
PAYSLIP
=======
Pay Period: ${new Date(payslip.pay_period_start).toLocaleDateString()} - ${new Date(payslip.pay_period_end).toLocaleDateString()}
Generated: ${new Date(payslip.generated_at).toLocaleDateString()}

EARNINGS
--------
Base Salary: ฿${Number(payslip.base_salary).toLocaleString()}
Allowances: ฿${Number(payslip.allowances).toLocaleString()}
Overtime Pay: ฿${Number(payslip.overtime_pay).toLocaleString()}
Gross Pay: ฿${Number(payslip.gross_pay).toLocaleString()}

DEDUCTIONS
----------
Tax: ฿${Number(payslip.tax_deduction).toLocaleString()}
Social Security: ฿${Number(payslip.social_security).toLocaleString()}
Other Deductions: ฿${Number(payslip.other_deductions).toLocaleString()}

NET PAY: ฿${Number(payslip.net_pay).toLocaleString()}
Status: ${payslip.status.toUpperCase()}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payslip-${payslip.pay_period_start}-${payslip.pay_period_end}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <History className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Payroll History</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payslips && payslips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Period</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      {new Date(payslip.pay_period_start).toLocaleDateString()} - {new Date(payslip.pay_period_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{Number(payslip.gross_pay).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      -฿{(Number(payslip.tax_deduction) + Number(payslip.social_security) + Number(payslip.other_deductions)).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ฿{Number(payslip.net_pay).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payslip.status)}`}>
                        {payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPayslip(payslip)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Payslip Details</DialogTitle>
                            </DialogHeader>
                            {selectedPayslip && (
                              <div className="space-y-4">
                                <div className="border-b pb-2">
                                  <p className="text-sm text-muted-foreground">Pay Period</p>
                                  <p className="font-semibold">
                                    {new Date(selectedPayslip.pay_period_start).toLocaleDateString()} - {new Date(selectedPayslip.pay_period_end).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-green-700">Earnings</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span>Base Salary:</span>
                                    <span className="text-right">฿{Number(selectedPayslip.base_salary).toLocaleString()}</span>
                                    <span>Allowances:</span>
                                    <span className="text-right">฿{Number(selectedPayslip.allowances).toLocaleString()}</span>
                                    <span>Overtime:</span>
                                    <span className="text-right">฿{Number(selectedPayslip.overtime_pay).toLocaleString()}</span>
                                    <span className="font-semibold">Gross Pay:</span>
                                    <span className="text-right font-semibold">฿{Number(selectedPayslip.gross_pay).toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-red-700">Deductions</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span>Tax:</span>
                                    <span className="text-right">฿{Number(selectedPayslip.tax_deduction).toLocaleString()}</span>
                                    <span>Social Security:</span>
                                    <span className="text-right">฿{Number(selectedPayslip.social_security).toLocaleString()}</span>
                                    <span>Other:</span>
                                    <span className="text-right">฿{Number(selectedPayslip.other_deductions).toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="border-t pt-2 flex justify-between items-center">
                                  <span className="font-bold text-lg">Net Pay:</span>
                                  <span className="font-bold text-lg text-primary">฿{Number(selectedPayslip.net_pay).toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(payslip)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No payroll history available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
