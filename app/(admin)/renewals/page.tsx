import { supabase } from "@/lib/supabase";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader, Avatar, StatusBadge } from "@/components/ui";
import { memberViews } from "@/lib/queries";
import Link from "next/link";
import { ContactButtons } from "@/components/contact-buttons";
import { formatINR } from "@/lib/dates";

export default async function RenewalsPage() {
  const scope = await getBranchScope();
  const mViews = await memberViews(scope);

  const expiring = mViews.filter(m => m.display === "expiring").sort((a, b) => a.daysLeft - b.daysLeft);
  const expired = mViews.filter(m => m.display === "expired").sort((a, b) => a.endDate.localeCompare(b.endDate)).reverse();
  const withDues = mViews.filter(m => m.balanceDue > 0).sort((a, b) => b.balanceDue - a.balanceDue);

  return (
    <div className="space-y-6">
      <PageHeader title="Renewals & Dues" subtitle="Track expiring memberships and pending payments" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Expiring Soon (${expiring.length})`} bodyClassName="p-0">
           <div className="divide-y divide-slate-100 h-96 overflow-y-auto">
              {expiring.map(m => (
                 <div key={m.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size="sm" />
                      <div>
                        <Link href={`/members/${m.id}`} className="text-sm font-medium hover:underline">{m.name}</Link>
                        <p className="text-xs text-yellow-600 dark:text-yellow-500">{m.daysLeft} days left ({m.endDate})</p>
                      </div>
                    </div>
                    <ContactButtons contact={{ name: m.name, phone: m.phone, email: m.email, refId: m.id, refType: "member" }} template="expiry" />
                 </div>
              ))}
              {expiring.length === 0 && <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No memberships expiring soon.</div>}
           </div>
        </Card>

        <Card title={`Pending Dues (${withDues.length})`} bodyClassName="p-0">
           <div className="divide-y divide-slate-100 h-96 overflow-y-auto">
              {withDues.map(m => (
                 <div key={m.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size="sm" />
                      <div>
                        <Link href={`/members/${m.id}`} className="text-sm font-medium hover:underline">{m.name}</Link>
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-500">Due: {formatINR(m.balanceDue)}</p>
                      </div>
                    </div>
                    <ContactButtons contact={{ name: m.name, phone: m.phone, email: m.email, refId: m.id, refType: "member" }} template="due" />
                 </div>
              ))}
              {withDues.length === 0 && <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No pending dues.</div>}
           </div>
        </Card>
      </div>

       <Card title={`Recently Expired (${expired.length})`} bodyClassName="p-0">
           <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {expired.map(m => (
                 <div key={m.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size="sm" />
                      <div>
                        <Link href={`/members/${m.id}`} className="text-sm font-medium hover:underline">{m.name}</Link>
                        <p className="text-xs text-red-600 dark:text-red-500">Expired on {m.endDate}</p>
                      </div>
                    </div>
                    <ContactButtons contact={{ name: m.name, phone: m.phone, email: m.email, refId: m.id, refType: "member" }} template="expired" />
                 </div>
              ))}
              {expired.length === 0 && <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No expired memberships.</div>}
           </div>
        </Card>
    </div>
  );
}
