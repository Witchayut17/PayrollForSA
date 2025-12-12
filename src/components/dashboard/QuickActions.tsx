import { UserPlus, Calculator, FileDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { label: "Add Employee", icon: UserPlus, variant: "default" as const },
  { label: "Run Payroll", icon: Calculator, variant: "success" as const },
  { label: "Export Report", icon: FileDown, variant: "secondary" as const },
  { label: "Send Payslips", icon: Send, variant: "secondary" as const },
];

export function QuickActions() {
  return (
    <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto flex-col gap-2 py-4"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
