import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function PayrollReviewView() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payroll Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Review your payroll information and payment details.</p>
        </CardContent>
      </Card>
    </div>
  );
}
