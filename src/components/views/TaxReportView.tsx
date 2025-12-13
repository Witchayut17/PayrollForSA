import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export function TaxReportView() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Tax Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Generate and view tax reports and compliance documents.</p>
        </CardContent>
      </Card>
    </div>
  );
}
