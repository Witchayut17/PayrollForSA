import { Users, DollarSign, Clock, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentPayroll } from "@/components/dashboard/RecentPayroll";
import { PayrollChart } from "@/components/dashboard/PayrollChart";
import { QuickActions } from "@/components/dashboard/QuickActions";

export function DashboardView() {
  return (
    <div className="space-y-6 p-6">
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value="248"
          change="+12 this month"
          changeType="positive"
          icon={Users}
          iconColor="text-primary"
        />
        <StatCard
          title="Monthly Payroll"
          value="$298,450"
          change="+5.4% from last month"
          changeType="positive"
          icon={DollarSign}
          iconColor="text-success"
        />
        <StatCard
          title="Pending Payslips"
          value="23"
          change="Due in 3 days"
          changeType="neutral"
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title="Average Salary"
          value="$6,250"
          change="+2.1% increase"
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-accent"
        />
      </div>

      {/* Charts and Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PayrollChart />
        </div>
        <QuickActions />
      </div>

      {/* Recent Payroll Table */}
      <RecentPayroll />
    </div>
  );
}
