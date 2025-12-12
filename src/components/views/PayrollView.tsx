import { useState } from "react";
import { Calculator, DollarSign, Percent, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PayrollView() {
  const [baseSalary, setBaseSalary] = useState(5000);
  const [overtimeHours, setOvertimeHours] = useState(10);
  const [bonus, setBonus] = useState(500);

  // Tax and deduction rates
  const taxRate = 0.22;
  const socialSecurityRate = 0.062;
  const medicareRate = 0.0145;
  const healthInsurance = 350;
  const retirement401k = baseSalary * 0.05;

  // Calculations
  const overtimeRate = (baseSalary / 160) * 1.5;
  const overtimePay = overtimeHours * overtimeRate;
  const grossPay = baseSalary + overtimePay + bonus;
  
  const taxDeduction = grossPay * taxRate;
  const socialSecurity = grossPay * socialSecurityRate;
  const medicare = grossPay * medicareRate;
  const totalDeductions = taxDeduction + socialSecurity + medicare + healthInsurance + retirement401k;
  const netPay = grossPay - totalDeductions;

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Salary Calculator</h3>
                <p className="text-sm text-muted-foreground">Calculate employee payroll</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseSalary">Base Monthly Salary</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="baseSalary"
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="overtime">Overtime Hours</Label>
                <Input
                  id="overtime"
                  type="number"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Rate: ${overtimeRate.toFixed(2)}/hour (1.5x regular rate)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus">Bonus</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="bonus"
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(Number(e.target.value))}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Deductions Info */}
          <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <MinusCircle className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="font-display font-semibold text-foreground">Deduction Rates</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Federal Tax</span>
                <span className="font-medium text-foreground">{(taxRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Social Security</span>
                <span className="font-medium text-foreground">{(socialSecurityRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medicare</span>
                <span className="font-medium text-foreground">{(medicareRate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Health Insurance</span>
                <span className="font-medium text-foreground">${healthInsurance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">401(k) Contribution</span>
                <span className="font-medium text-foreground">5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Earnings */}
          <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Earnings
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Base Salary</span>
                <span className="font-semibold text-foreground">${baseSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Overtime ({overtimeHours} hrs)</span>
                <span className="font-semibold text-foreground">${overtimePay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Bonus</span>
                <span className="font-semibold text-foreground">${bonus.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 bg-success/5 rounded-lg px-3 -mx-3">
                <span className="font-semibold text-foreground">Gross Pay</span>
                <span className="font-bold text-success text-lg">${grossPay.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Percent className="h-5 w-5 text-destructive" />
              Deductions
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Federal Tax</span>
                <span className="font-semibold text-destructive">-${taxDeduction.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Social Security</span>
                <span className="font-semibold text-destructive">-${socialSecurity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Medicare</span>
                <span className="font-semibold text-destructive">-${medicare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Health Insurance</span>
                <span className="font-semibold text-destructive">-${healthInsurance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">401(k)</span>
                <span className="font-semibold text-destructive">-${retirement401k.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold text-foreground">Total Deductions</span>
                <span className="font-bold text-destructive">-${totalDeductions.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="rounded-xl gradient-primary p-6 shadow-elevated animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Net Pay</p>
                <p className="text-3xl font-bold text-primary-foreground mt-1">
                  ${netPay.toFixed(2)}
                </p>
              </div>
              <Button variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                Generate Payslip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
