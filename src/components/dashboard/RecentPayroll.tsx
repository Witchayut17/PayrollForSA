import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const recentPayroll = [
  { 
    id: 1, 
    employee: "Sarah Johnson", 
    department: "Engineering", 
    amount: "$8,450.00", 
    status: "Paid",
    date: "Dec 1, 2025" 
  },
  { 
    id: 2, 
    employee: "Michael Chen", 
    department: "Marketing", 
    amount: "$6,200.00", 
    status: "Paid",
    date: "Dec 1, 2025" 
  },
  { 
    id: 3, 
    employee: "Emily Davis", 
    department: "Finance", 
    amount: "$7,800.00", 
    status: "Pending",
    date: "Dec 15, 2025" 
  },
  { 
    id: 4, 
    employee: "James Wilson", 
    department: "Operations", 
    amount: "$5,500.00", 
    status: "Paid",
    date: "Dec 1, 2025" 
  },
  { 
    id: 5, 
    employee: "Lisa Anderson", 
    department: "HR", 
    amount: "$6,900.00", 
    status: "Processing",
    date: "Dec 15, 2025" 
  },
];

export function RecentPayroll() {
  return (
    <div className="rounded-xl bg-card shadow-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Recent Payroll</h3>
          <p className="text-sm text-muted-foreground">Latest salary disbursements</p>
        </div>
        <Button variant="ghost" size="sm">View All</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recentPayroll.map((item) => (
              <tr key={item.id}>
                <td className="font-medium text-foreground">{item.employee}</td>
                <td className="text-muted-foreground">{item.department}</td>
                <td className="font-semibold text-foreground">{item.amount}</td>
                <td>
                  <span className={`badge ${
                    item.status === "Paid" ? "badge-success" :
                    item.status === "Pending" ? "badge-warning" :
                    "badge-primary"
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="text-muted-foreground">{item.date}</td>
                <td>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
