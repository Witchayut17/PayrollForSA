import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export function FinanceReportView() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Finance Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">View financial reports and summaries.</p>
        </CardContent>
      </Card>
    </div>
  );
}
