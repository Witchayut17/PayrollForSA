import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export function AttendanceFormView() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Attendance Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage and record employee attendance.</p>
        </CardContent>
      </Card>
    </div>
  );
}
