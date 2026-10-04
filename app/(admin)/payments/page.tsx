import { getDb } from "@/lib/db";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatINR } from "@/lib/dates";
import Link from "next/link";

export default async function PaymentsPage() {
  const db = await getDb();
  const scope = await getBranchScope();

  const payments = db.payments
    .filter(p => scope === "all" || p.branchId === scope)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const branches = db.branches;
  const members = db.members;

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="All member payments across branches" />

      <Card bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:bg-white/[0.02]">
                <th className="th">Date</th>
                <th className="th">Member</th>
                <th className="th">Type</th>
                <th className="th">Method</th>
                <th className="th text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {payments.map(p => {
                 const m = members.find(mx => mx.id === p.memberId);
                 return (
                   <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                     <td className="td text-slate-500 dark:text-slate-400">{p.date}</td>
                     <td className="td">
                       {m ? (
                         <Link href={`/members/${m.id}`} className="font-medium hover:underline">
                           {m.name}
                         </Link>
                       ) : (
                         <span className="text-slate-500 dark:text-slate-400">Unknown Member</span>
                       )}
                     </td>
                     <td className="td">
                        <Badge tone={p.type === "New" ? "green" : p.type === "Renewal" ? "indigo" : "slate"}>
                           {p.type}
                        </Badge>
                     </td>
                     <td className="td text-slate-500 dark:text-slate-400">{p.method}</td>
                     <td className="td text-right font-medium text-green-600">+{formatINR(p.amount)}</td>
                   </tr>
                 );
               })}
               {payments.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">No payments recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
