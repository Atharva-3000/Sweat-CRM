import { getDb } from "@/lib/db";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader, BarChart, StatCard } from "@/components/ui";
import { formatINR, lastNMonths, monthKey, today } from "@/lib/dates";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

export default async function ReportsPage() {
  const db = await getDb();
  const scope = await getBranchScope();
  const T = today();
  
  const months = lastNMonths(6, T);
  
  const monthlyData = months.map(m => {
    const rev = db.payments
      .filter(p => (scope === "all" || p.branchId === scope) && p.date.startsWith(m))
      .reduce((sum, p) => sum + p.amount, 0);
      
    const exp = db.expenses
      .filter(e => (scope === "all" || e.branchId === scope) && e.date.startsWith(m))
      .reduce((sum, e) => sum + e.amount, 0);
      
    const date = new Date(`${m}-01`);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    
    return { month: m, label, revenue: rev, expenses: exp, profit: rev - exp };
  });

  const currentMonth = monthlyData[monthlyData.length - 1];
  const lastMonth = monthlyData[monthlyData.length - 2] || { revenue: 0, expenses: 0, profit: 0 };

  const revDiff = currentMonth.revenue - lastMonth.revenue;
  const revTrend = revDiff >= 0 ? { icon: <ArrowUpRight className="h-4 w-4" />, color: "text-green-600" } : { icon: <ArrowDownRight className="h-4 w-4" />, color: "text-red-600" };

  const revChartData = monthlyData.map(d => ({ label: d.label, value: d.revenue }));
  const expChartData = monthlyData.map(d => ({ label: d.label, value: d.expenses }));
  const profitChartData = monthlyData.map(d => ({ label: d.label, value: d.profit }));

  return (
    <div className="space-y-6">
      <PageHeader title="Financial Reports" subtitle="6-month financial overview" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard 
           label="Revenue (This Month)" 
           value={formatINR(currentMonth.revenue)} 
           tone="green"
        />
        <StatCard 
           label="Expenses (This Month)" 
           value={formatINR(currentMonth.expenses)} 
           tone="red" 
        />
        <StatCard 
           label="Net Profit (This Month)" 
           value={formatINR(currentMonth.profit)} 
           tone={currentMonth.profit >= 0 ? "indigo" : "red"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Revenue Trend">
          <BarChart data={revChartData} format={formatINR} height={300} />
        </Card>
        <Card title="Expense Trend">
          <BarChart data={expChartData} format={formatINR} height={300} />
        </Card>
      </div>
      
      <Card title="Profit Margin">
         <BarChart data={profitChartData} format={formatINR} height={300} />
      </Card>

      <Card title="Monthly Breakdown" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:bg-white/[0.02]">
                <th className="th">Month</th>
                <th className="th text-right">Revenue</th>
                <th className="th text-right">Expenses</th>
                <th className="th text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {[...monthlyData].reverse().map(d => (
                 <tr key={d.month} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                   <td className="td font-medium">{d.label}</td>
                   <td className="td text-right text-green-600">{formatINR(d.revenue)}</td>
                   <td className="td text-right text-red-600">{formatINR(d.expenses)}</td>
                   <td className={`td text-right font-medium ${d.profit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                     {formatINR(d.profit)}
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
