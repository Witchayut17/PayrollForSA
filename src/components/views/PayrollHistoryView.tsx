import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export function PayrollHistoryView() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payroll History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">View your complete payroll history and past payments.</p>
        </CardContent>
      </Card>
    </div>
  );
}
