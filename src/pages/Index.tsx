import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DashboardView } from "@/components/views/DashboardView";
import { EmployeesView } from "@/components/views/EmployeesView";
import { PayrollView } from "@/components/views/PayrollView";
import { PayslipsView } from "@/components/views/PayslipsView";
import { ReportsView } from "@/components/views/ReportsView";
import { SettingsView } from "@/components/views/SettingsView";
import { useAuth } from "@/hooks/useAuth";

const viewTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Welcome back! Here's your payroll overview." },
  employees: { title: "Employees", subtitle: "Manage your workforce and employee details." },
  payroll: { title: "Payroll Calculator", subtitle: "Calculate salaries, deductions, and net pay." },
  payslips: { title: "Payslips", subtitle: "View and manage employee payslips." },
  reports: { title: "Reports", subtitle: "Analytics and downloadable reports." },
  settings: { title: "Settings", subtitle: "Configure your payroll system." },
};

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const currentView = viewTitles[activeView] || viewTitles.dashboard;
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "employees":
        return <EmployeesView />;
      case "payroll":
        return <PayrollView />;
      case "payslips":
        return <PayslipsView />;
      case "reports":
        return <ReportsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeView={activeView} onNavigate={setActiveView} onLogout={handleLogout} />
      <div className="pl-64">
        <Header title={currentView.title} subtitle={currentView.subtitle} />
        <main className="min-h-[calc(100vh-4rem)]">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default Index;
