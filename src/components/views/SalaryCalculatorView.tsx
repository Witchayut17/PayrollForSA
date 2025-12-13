import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export function SalaryCalculatorView() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Salary Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Calculate employee salaries, deductions, and net pay.</p>
        </CardContent>
      </Card>
    </div>
  );
}
