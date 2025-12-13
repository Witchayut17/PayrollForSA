import { 
  FileText, 
  History,
  Calendar,
  User,
  LogOut,
  Building2,
  ClipboardList,
  Users,
  UserCog,
  BarChart3,
  CheckCircle,
  DollarSign,
  BookOpen,
  Calculator,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

// Employee navigation
const employeeNavigation = [
  { id: "payroll-review", label: "ตรวจสอบเงินเดือน", icon: FileText },
  { id: "payroll-history", label: "ประวัติการจ่ายเงิน", icon: History },
  { id: "leave-ot-request", label: "ขอลา/ขอ OT", icon: Calendar },
  { id: "profile", label: "โปรไฟล์", icon: User },
];

// HR navigation
const hrNavigation = [
  { id: "attendance-form", label: "บันทึกเวลาทำงาน", icon: ClipboardList },
  { id: "employee-list", label: "รายชื่อพนักงาน", icon: Users },
  { id: "employee-management", label: "จัดการพนักงาน", icon: UserCog },
  { id: "salary-management", label: "จัดการเงินเดือน", icon: DollarSign },
  { id: "hr-report", label: "รายงาน HR", icon: BarChart3 },
  { id: "leave-ot-approval", label: "อนุมัติลา/OT", icon: CheckCircle },
];

// Accountant navigation
const accountantNavigation = [
  { id: "finance-report", label: "รายงานการเงิน", icon: DollarSign },
  { id: "payroll-accounting", label: "บัญชีเงินเดือน", icon: BookOpen },
  { id: "payroll-review", label: "ตรวจสอบเงินเดือน", icon: FileText },
  { id: "salary-calculator", label: "คำนวณเงินเดือน", icon: Calculator },
  { id: "tax-report", label: "รายงานภาษี", icon: Receipt },
];

function getNavigationByRole(role: AppRole | null) {
  switch (role) {
    case "hr":
      return hrNavigation;
    case "accountant":
      return accountantNavigation;
    case "employee":
    default:
      return employeeNavigation;
  }
}

const roleLabels: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  employee: "พนักงาน",
  hr: "ฝ่ายบุคคล",
  accountant: "ฝ่ายบัญชี",
};

export function Sidebar({ activeView, onNavigate, onLogout }: SidebarProps) {
  const { user } = useAuth();
  const { role } = useUserRole();
  
  const navigation = getNavigationByRole(role);
  
  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  const displayName = user?.user_metadata?.full_name || user?.email || "ผู้ใช้";
  const roleLabel = role ? roleLabels[role] || role : "พนักงาน";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 gradient-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-sidebar-foreground leading-tight">บริษัท เปาปอนหยกฝ้ายองุ่น</h1>
            <p className="text-xs text-sidebar-foreground/60">จำกัด</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "nav-link w-full",
                  isActive && "active"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{roleLabel}</p>
            </div>
            <button 
              onClick={onLogout}
              className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
