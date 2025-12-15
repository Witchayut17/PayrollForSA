import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

// Employee views
import { PayrollReviewView } from "@/components/views/PayrollReviewView";
import { PayrollHistoryView } from "@/components/views/PayrollHistoryView";
import { LeaveOTRequestView } from "@/components/views/LeaveOTRequestView";
import { PayslipsView } from "@/components/views/PayslipsView";
import { ProfileView } from "@/components/views/ProfileView";

// HR views
import { AttendanceFormView } from "@/components/views/AttendanceFormView";
import { EmployeeListView } from "@/components/views/EmployeeListView";
import { EmployeeManagementView } from "@/components/views/EmployeeManagementView";
import { HRReportView } from "@/components/views/HRReportView";
import { LeaveOTApprovalView } from "@/components/views/LeaveOTApprovalView";
import SalaryManagementView from "@/components/views/SalaryManagementView";

// Accountant views
import { HRDataView } from "@/components/views/HRDataView";
import { FinanceReportView } from "@/components/views/FinanceReportView";
import { PayrollAccountingView } from "@/components/views/PayrollAccountingView";
import { SalaryCalculatorView } from "@/components/views/SalaryCalculatorView";
import { TaxReportView } from "@/components/views/TaxReportView";

const viewTitles: Record<string, { title: string; subtitle: string }> = {
  // Employee views
  "payroll-review": { title: "ตรวจสอบเงินเดือน", subtitle: "ตรวจสอบข้อมูลเงินเดือนของคุณ" },
  "payroll-history": { title: "ประวัติการจ่ายเงิน", subtitle: "ดูประวัติการรับเงินเดือน" },
  "leave-ot-request": { title: "ขอลา/ขอ OT", subtitle: "ยื่นคำขอลางานและทำงานล่วงเวลา" },
  "payslips": { title: "สลิปเงินเดือน", subtitle: "ดูและดาวน์โหลดสลิปเงินเดือน" },
  "profile": { title: "โปรไฟล์ของฉัน", subtitle: "ดูและแก้ไขข้อมูลส่วนตัว" },
  
  // HR views
  "attendance-form": { title: "บันทึกเวลาทำงาน", subtitle: "บันทึกการมาทำงานของพนักงาน" },
  "employee-list": { title: "รายชื่อพนักงาน", subtitle: "ดูรายชื่อพนักงานทั้งหมด" },
  "employee-management": { title: "จัดการพนักงาน", subtitle: "จัดการข้อมูลพนักงาน" },
  "salary-management": { title: "จัดการเงินเดือน", subtitle: "กำหนดและจัดการเงินเดือนพนักงาน" },
  "hr-report": { title: "รายงาน HR", subtitle: "ดูรายงานและสถิติ HR" },
  "leave-ot-approval": { title: "อนุมัติลา/OT", subtitle: "อนุมัติคำขอลางานและ OT" },
  
  // Accountant views
  "hr-data": { title: "ข้อมูลจาก HR", subtitle: "ดูข้อมูลที่ HR ส่งมาสำหรับคำนวณเงินเดือน" },
  "finance-report": { title: "รายงานการเงิน", subtitle: "ดูรายงานการเงิน" },
  "payroll-accounting": { title: "บัญชีเงินเดือน", subtitle: "จัดการบัญชีเงินเดือน" },
  "salary-calculator": { title: "คำนวณเงินเดือน", subtitle: "คำนวณเงินเดือนพนักงาน" },
  "tax-report": { title: "รายงานภาษี", subtitle: "สร้างรายงานภาษี" },
};

function getDefaultView(role: string | null) {
  switch (role) {
    case "hr":
      return "attendance-form";
    case "accountant":
      return "hr-data";
    case "employee":
    default:
      return "payroll-review";
  }
}

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [activeView, setActiveView] = useState<string | null>(null);

  // Set default view based on role
  useEffect(() => {
    if (!roleLoading && role && !activeView) {
      setActiveView(getDefaultView(role));
    }
  }, [role, roleLoading, activeView]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const renderView = () => {
    switch (activeView) {
      // Employee views
      case "payroll-review":
        return <PayrollReviewView />;
      case "payroll-history":
        return <PayrollHistoryView />;
      case "leave-ot-request":
        return <LeaveOTRequestView />;
      case "payslips":
        return <PayslipsView />;
      case "profile":
        return <ProfileView />;
      
      // HR views
      case "attendance-form":
        return <AttendanceFormView />;
      case "employee-list":
        return <EmployeeListView />;
      case "employee-management":
        return <EmployeeManagementView />;
      case "salary-management":
        return <SalaryManagementView />;
      case "hr-report":
        return <HRReportView />;
      case "leave-ot-approval":
        return <LeaveOTApprovalView />;
      
      // Accountant views
      case "hr-data":
        return <HRDataView />;
      case "finance-report":
        return <FinanceReportView />;
      case "payroll-accounting":
        return <PayrollAccountingView />;
      case "salary-calculator":
        return <SalaryCalculatorView />;
      case "tax-report":
        return <TaxReportView />;
      
      default:
        return <PayrollReviewView />;
    }
  };

  const loading = authLoading || roleLoading;

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

  const currentView = viewTitles[activeView || "payroll-review"] || viewTitles["payroll-review"];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeView={activeView || ""} onNavigate={setActiveView} onLogout={handleLogout} />
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
