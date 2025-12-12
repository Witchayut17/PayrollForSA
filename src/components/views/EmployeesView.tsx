import { useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const employees = [
  { 
    id: 1, 
    name: "Sarah Johnson", 
    email: "sarah.j@company.com",
    phone: "+1 555-0123",
    department: "Engineering", 
    position: "Senior Developer",
    salary: "$8,450",
    status: "Active",
    joinDate: "Mar 15, 2022",
    avatar: "SJ"
  },
  { 
    id: 2, 
    name: "Michael Chen", 
    email: "m.chen@company.com",
    phone: "+1 555-0124",
    department: "Marketing", 
    position: "Marketing Manager",
    salary: "$6,200",
    status: "Active",
    joinDate: "Jul 22, 2021",
    avatar: "MC"
  },
  { 
    id: 3, 
    name: "Emily Davis", 
    email: "e.davis@company.com",
    phone: "+1 555-0125",
    department: "Finance", 
    position: "Financial Analyst",
    salary: "$7,800",
    status: "Active",
    joinDate: "Jan 10, 2023",
    avatar: "ED"
  },
  { 
    id: 4, 
    name: "James Wilson", 
    email: "j.wilson@company.com",
    phone: "+1 555-0126",
    department: "Operations", 
    position: "Operations Lead",
    salary: "$5,500",
    status: "On Leave",
    joinDate: "Sep 5, 2020",
    avatar: "JW"
  },
  { 
    id: 5, 
    name: "Lisa Anderson", 
    email: "l.anderson@company.com",
    phone: "+1 555-0127",
    department: "HR", 
    position: "HR Specialist",
    salary: "$6,900",
    status: "Active",
    joinDate: "Nov 18, 2022",
    avatar: "LA"
  },
  { 
    id: 6, 
    name: "Robert Martinez", 
    email: "r.martinez@company.com",
    phone: "+1 555-0128",
    department: "Engineering", 
    position: "DevOps Engineer",
    salary: "$7,200",
    status: "Active",
    joinDate: "Feb 28, 2023",
    avatar: "RM"
  },
];

export function EmployeesView() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee, index) => (
          <div 
            key={employee.id} 
            className="rounded-xl bg-card p-6 shadow-card transition-all duration-200 hover:shadow-elevated animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {employee.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{employee.name}</h3>
                  <p className="text-sm text-muted-foreground">{employee.position}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{employee.phone}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium text-foreground">{employee.department}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Salary</p>
                <p className="text-sm font-semibold text-foreground">{employee.salary}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className={`badge ${
                employee.status === "Active" ? "badge-success" : "badge-warning"
              }`}>
                {employee.status}
              </span>
              <span className="text-xs text-muted-foreground">Since {employee.joinDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
