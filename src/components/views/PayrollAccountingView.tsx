import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export function PayrollAccountingView() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Payroll Accounting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage payroll accounting and journal entries.</p>
        </CardContent>
      </Card>
    </div>
  );
}
