import { Download, Eye, Send, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const payslips = [
  {
    id: 1,
    employee: "Sarah Johnson",
    period: "December 2025",
    grossPay: "$8,950.00",
    deductions: "$2,684.00",
    netPay: "$6,266.00",
    status: "Sent",
    generatedDate: "Dec 1, 2025"
  },
  {
    id: 2,
    employee: "Michael Chen",
    period: "December 2025",
    grossPay: "$6,700.00",
    deductions: "$1,942.00",
    netPay: "$4,758.00",
    status: "Sent",
    generatedDate: "Dec 1, 2025"
  },
  {
    id: 3,
    employee: "Emily Davis",
    period: "December 2025",
    grossPay: "$8,100.00",
    deductions: "$2,430.00",
    netPay: "$5,670.00",
    status: "Pending",
    generatedDate: "Dec 10, 2025"
  },
  {
    id: 4,
    employee: "James Wilson",
    period: "December 2025",
    grossPay: "$5,800.00",
    deductions: "$1,682.00",
    netPay: "$4,118.00",
    status: "Draft",
    generatedDate: "Dec 10, 2025"
  },
  {
    id: 5,
    employee: "Lisa Anderson",
    period: "December 2025",
    grossPay: "$7,200.00",
    deductions: "$2,088.00",
    netPay: "$5,112.00",
    status: "Sent",
    generatedDate: "Dec 1, 2025"
  },
  {
    id: 6,
    employee: "Robert Martinez",
    period: "December 2025",
    grossPay: "$7,500.00",
    deductions: "$2,175.00",
    netPay: "$5,325.00",
    status: "Pending",
    generatedDate: "Dec 10, 2025"
  },
];

export function PayslipsView() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search payslips..." className="pl-9" />
          </div>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            December 2025
          </Button>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button variant="default">
            <Send className="mr-2 h-4 w-4" />
            Send All Pending
          </Button>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="rounded-xl bg-card shadow-card overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Pay Period</th>
                <th>Gross Pay</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Generated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((payslip, index) => (
                <tr 
                  key={payslip.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <td className="font-medium text-foreground">{payslip.employee}</td>
                  <td className="text-muted-foreground">{payslip.period}</td>
                  <td className="font-semibold text-foreground">{payslip.grossPay}</td>
                  <td className="text-destructive">{payslip.deductions}</td>
                  <td className="font-bold text-success">{payslip.netPay}</td>
                  <td>
                    <span className={`badge ${
                      payslip.status === "Sent" ? "badge-success" :
                      payslip.status === "Pending" ? "badge-warning" :
                      "badge-primary"
                    }`}>
                      {payslip.status}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{payslip.generatedDate}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      {payslip.status !== "Sent" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Send">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="rounded-xl bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Total Gross Payroll</p>
          <p className="text-2xl font-bold text-foreground mt-1">$44,250.00</p>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Total Deductions</p>
          <p className="text-2xl font-bold text-destructive mt-1">$13,001.00</p>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Total Net Payroll</p>
          <p className="text-2xl font-bold text-success mt-1">$31,249.00</p>
        </div>
      </div>
    </div>
  );
}
