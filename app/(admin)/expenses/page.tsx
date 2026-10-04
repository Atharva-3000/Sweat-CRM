import { supabase } from "@/lib/supabase";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader, Badge } from "@/components/ui";
import { ModalForm } from "@/components/action-form";
import { addExpense } from "@/app/actions";
import { formatINR, monthKey, today } from "@/lib/dates";

export default async function ExpensesPage() {
  const { data: _expensesData } = await supabase.from('expenses').select('*');
  const _expenses = _expensesData || [];
  const { data: _branchesData } = await supabase.from('branches').select('*');
  const _branches = _branchesData || [];
  const scope = await getBranchScope();
  const T = today();
  const currentMonth = monthKey(T);

  const expenses = _expenses
    .filter(e => scope === "all" || e.branchId === scope)
    .sort((a, b) => b.id.localeCompare(a.id));

  const branches = _branches;

  const thisMonthTotal = expenses
    .filter(e => e.date.startsWith(currentMonth))
    .reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Expenses" 
        subtitle={`Total this month: ${formatINR(thisMonthTotal)}`}
        actions={
          <ModalForm trigger="Record Expense" title="New Expense" action={addExpense}>
             <div className="space-y-4">
                <div>
                  <label className="label">Description</label>
                  <input name="description" required className="input" placeholder="e.g. Electricity Bill" />
                </div>
                <div>
                  <label className="label">Amount</label>
                  <input type="number" name="amount" min="1" required className="input" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select name="category" required className="input">
                     <option>Utilities</option>
                     <option>Rent</option>
                     <option>Salaries</option>
                     <option>Maintenance</option>
                     <option>Marketing</option>
                     <option>Other</option>
                  </select>
                </div>
                 <div>
                  <label className="label">Date</label>
                  <input type="date" name="date" required defaultValue={T} className="input" />
                </div>
                {scope === "all" && (
                   <div>
                    <label className="label">Branch</label>
                    <select name="branchId" required className="input">
                       {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
             </div>
          </ModalForm>
        }
      />

      <Card bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:bg-white/[0.02]">
                <th className="th">Date</th>
                <th className="th">Description</th>
                <th className="th">Category</th>
                <th className="th text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {expenses.map(e => (
                 <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                   <td className="td text-slate-500 dark:text-slate-400">{e.date}</td>
                   <td className="td font-medium">{e.note}</td>
                   <td className="td"><Badge>{e.category}</Badge></td>
                   <td className="td text-right font-medium text-red-600">-{formatINR(e.amount)}</td>
                 </tr>
               ))}
               {expenses.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">No expenses recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
