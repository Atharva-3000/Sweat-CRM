import { getBranchScope } from "@/lib/auth";
import { memberViews } from "@/lib/queries";
import { Card, PageHeader, StatusBadge, Avatar, Badge } from "@/components/ui";
import { Search } from "lucide-react";
import Link from "next/link";
import { ContactButtons } from "@/components/contact-buttons";

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const scope = await getBranchScope();
  
  let members = await memberViews(scope);
  
  if (q) {
    const term = q.toLowerCase();
    members = members.filter(m => m.name.toLowerCase().includes(term) || m.phone.includes(term) || m.id.toLowerCase().includes(term));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        actions={
          <div className="flex gap-2">
            <Link href="/members/import" className="btn-secondary">
              Import CSV
            </Link>
            <Link href="/members/new" className="btn-primary">
              Add Member
            </Link>
          </div>
        }
      />

      <Card bodyClassName="p-0">
        <div className="border-b border-slate-100 p-4">
          <form className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, phone or ID..."
              className="input pl-9"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:bg-white/[0.02]">
                <th className="th">Member</th>
                <th className="th">Status</th>
                <th className="th">Plan</th>
                <th className="th">End Date</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size="sm" />
                      <div>
                        <Link href={`/members/${m.id}`} className="font-medium hover:underline">
                          {m.name}
                        </Link>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {m.id} · {m.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <StatusBadge status={m.display} />
                  </td>
                  <td className="td text-slate-500 dark:text-slate-400">{m.planName}</td>
                  <td className="td text-slate-500 dark:text-slate-400">
                    {m.endDate}
                    {m.display === "expiring" && (
                      <div className="text-xs text-amber-600">{m.daysLeft} days left</div>
                    )}
                  </td>
                  <td className="td text-right">
                    <ContactButtons
                      contact={{ name: m.name, phone: m.phone, email: m.email, refId: m.id, refType: "member" }}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
