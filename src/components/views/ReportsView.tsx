import { FileText, Download, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";

const departmentData = [
  { name: "Engineering", payroll: 125000 },
  { name: "Marketing", payroll: 68000 },
  { name: "Finance", payroll: 54000 },
  { name: "Operations", payroll: 32000 },
  { name: "HR", payroll: 19450 },
];

const distributionData = [
  { name: "Salaries", value: 240000, color: "hsl(220, 70%, 50%)" },
  { name: "Overtime", value: 28000, color: "hsl(160, 60%, 45%)" },
  { name: "Bonuses", value: 18000, color: "hsl(38, 92%, 50%)" },
  { name: "Benefits", value: 12450, color: "hsl(280, 65%, 60%)" },
];

const reports = [
  { 
    id: 1, 
    name: "Monthly Payroll Summary", 
    description: "Complete payroll breakdown for December 2025",
    type: "PDF",
    size: "2.4 MB"
  },
  { 
    id: 2, 
    name: "Tax Deduction Report", 
    description: "Federal and state tax withholdings",
    type: "Excel",
    size: "1.1 MB"
  },
  { 
    id: 3, 
    name: "Employee Benefits Report", 
    description: "Health insurance and 401(k) contributions",
    type: "PDF",
    size: "1.8 MB"
  },
  { 
    id: 4, 
    name: "Overtime Analysis", 
    description: "Overtime hours and payments by department",
    type: "Excel",
    size: "856 KB"
  },
];

export function ReportsView() {
  return (
    <div className="p-6 space-y-6">
      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Payroll Bar Chart */}
        <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Payroll by Department</h3>
              <p className="text-sm text-muted-foreground">Monthly distribution</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(220, 15%, 50%)', fontSize: 12 }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(220, 15%, 50%)', fontSize: 12 }}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(214, 20%, 90%)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Payroll']}
                />
                <Bar dataKey="payroll" fill="hsl(220, 70%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payroll Distribution Pie Chart */}
        <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <PieChart className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Payroll Distribution</h3>
              <p className="text-sm text-muted-foreground">Breakdown by category</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {distributionData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">${item.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Available Reports */}
      <div className="rounded-xl bg-card shadow-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Available Reports</h3>
              <p className="text-sm text-muted-foreground">Download or generate reports</p>
            </div>
          </div>
          <Button variant="default">
            Generate New Report
          </Button>
        </div>
        <div className="divide-y divide-border">
          {reports.map((report, index) => (
            <div 
              key={report.id} 
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors animate-slide-up"
              style={{ animationDelay: `${0.15 + index * 0.03}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{report.name}</p>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="badge badge-primary">{report.type}</span>
                  <p className="text-xs text-muted-foreground mt-1">{report.size}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
