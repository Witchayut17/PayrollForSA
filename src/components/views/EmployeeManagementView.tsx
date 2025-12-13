import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog } from "lucide-react";

export function EmployeeManagementView() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Employee Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Add, edit, and manage employee information.</p>
        </CardContent>
      </Card>
    </div>
  );
}
