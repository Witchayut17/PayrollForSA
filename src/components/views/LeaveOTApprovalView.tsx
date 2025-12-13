import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export function LeaveOTApprovalView() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Leave & OT Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Review and approve employee leave and overtime requests.</p>
        </CardContent>
      </Card>
    </div>
  );
}
