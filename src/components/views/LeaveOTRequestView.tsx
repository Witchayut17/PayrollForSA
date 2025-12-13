import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export function LeaveOTRequestView() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave & OT Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Submit leave requests and overtime (OT) requests to HR.</p>
        </CardContent>
      </Card>
    </div>
  );
}
