import { Building, CreditCard, Users, Bell, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const settingsSections = [
  {
    id: "company",
    icon: Building,
    title: "Company Information",
    description: "Manage your company details and branding"
  },
  {
    id: "payroll",
    icon: CreditCard,
    title: "Payroll Settings",
    description: "Configure pay periods, tax rates, and deductions"
  },
  {
    id: "users",
    icon: Users,
    title: "User Management",
    description: "Manage user access and permissions"
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description: "Configure email and system notifications"
  },
  {
    id: "security",
    icon: Shield,
    title: "Security",
    description: "Password policies and two-factor authentication"
  },
  {
    id: "compliance",
    icon: Globe,
    title: "Compliance",
    description: "Tax regulations and labor law settings"
  },
];

export function SettingsView() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-card shadow-card overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-border">
              <h3 className="font-display font-semibold text-foreground">Settings</h3>
              <p className="text-sm text-muted-foreground">Manage your preferences</p>
            </div>
            <nav className="p-2">
              {settingsSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors hover:bg-muted animate-slide-up"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Company Information</h3>
                <p className="text-sm text-muted-foreground">Update your company details</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue="Acme Corporation" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / EIN</Label>
                <Input id="taxId" defaultValue="12-3456789" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="123 Business Ave, Suite 100, New York, NY 10001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue="+1 (555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="hr@acmecorp.com" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </div>

          {/* Payroll Settings */}
          <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CreditCard className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Payroll Settings</h3>
                <p className="text-sm text-muted-foreground">Configure payroll parameters</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Pay Period</p>
                  <p className="text-sm text-muted-foreground">Monthly (1st - End of month)</p>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Overtime Rate</p>
                  <p className="text-sm text-muted-foreground">1.5x regular hourly rate</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-foreground">Auto-calculate Tax</p>
                  <p className="text-sm text-muted-foreground">Automatically calculate federal and state taxes</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">Manage notification preferences</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Payroll Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified before payroll due dates</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">New Employee Alerts</p>
                  <p className="text-sm text-muted-foreground">Notify when new employees are added</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-foreground">Report Generation</p>
                  <p className="text-sm text-muted-foreground">Weekly summary reports via email</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
