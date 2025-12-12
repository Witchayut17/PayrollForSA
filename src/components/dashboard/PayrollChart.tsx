import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jul", amount: 245000 },
  { month: "Aug", amount: 258000 },
  { month: "Sep", amount: 262000 },
  { month: "Oct", amount: 275000 },
  { month: "Nov", amount: 282000 },
  { month: "Dec", amount: 298000 },
];

export function PayrollChart() {
  return (
    <div className="rounded-xl bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.15s' }}>
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold text-foreground">Payroll Trends</h3>
        <p className="text-sm text-muted-foreground">Monthly payroll expenditure</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(220, 15%, 50%)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(220, 15%, 50%)', fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(214, 20%, 90%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px hsl(220 30% 15% / 0.1)'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Payroll']}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(220, 70%, 50%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAmount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
