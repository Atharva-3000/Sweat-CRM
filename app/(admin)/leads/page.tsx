import { getDb } from "@/lib/db";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader, Badge } from "@/components/ui";
import { ContactButtons } from "@/components/contact-buttons";
import { ActionForm, SubmitButton, ModalForm, ActionButton } from "@/components/action-form";
import { AutoSubmitSelect } from "@/components/auto-submit";
import { saveLead, setLeadStatus, deleteLead } from "@/app/actions";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function LeadsPage() {
  const db = await getDb();
  const scope = await getBranchScope();

  const leads = db.leads
    .filter(l => scope === "all" || l.branchId === scope)
    .sort((a, b) => b.id.localeCompare(a.id));

  const branches = db.branches;

  const statusColors: Record<string, string> = {
    "New": "bg-blue-100 text-blue-700",
    "Contacted": "bg-amber-100 text-amber-700",
    "Trial": "bg-purple-100 text-purple-700",
    "Converted": "bg-green-100 text-green-700",
    "Lost": "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Leads" 
        actions={
          <ModalForm trigger="Add Lead" title="New Lead" action={saveLead}>
             <div className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input name="name" required className="input" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="phone" required className="input" />
                </div>
                <div>
                  <label className="label">Source</label>
                  <select name="source" className="input">
                     <option>Walk-in</option>
                     <option>Instagram</option>
                     <option>Facebook</option>
                     <option>Referral</option>
                     <option>Website</option>
                  </select>
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
                <th className="th">Lead</th>
                <th className="th">Source</th>
                <th className="th">Date</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {leads.map(l => (
                 <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                   <td className="td">
                     <div className="font-medium">{l.name}</div>
                     <div className="text-xs text-slate-500 dark:text-slate-400">{l.phone}</div>
                   </td>
                   <td className="td text-slate-500 dark:text-slate-400">{l.source}</td>
                   <td className="td text-slate-500 dark:text-slate-400">{l.createdAt}</td>
                   <td className="td">
                      <ActionForm action={setLeadStatus} className="inline-block">
                         <input type="hidden" name="id" value={l.id} />
                         <AutoSubmitSelect 
                           name="status" 
                           defaultValue={l.status} 
                           className={`text-xs rounded-full px-2 py-1 font-medium border-0 cursor-pointer ${statusColors[l.status]}`}
                         >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Trial">Trial</option>
                            <option value="Converted">Converted</option>
                            <option value="Lost">Lost</option>
                         </AutoSubmitSelect>
                      </ActionForm>
                   </td>
                   <td className="td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ContactButtons contact={{ name: l.name, phone: l.phone, refId: l.id, refType: "lead" }} template="lead" size="sm" />
                        
                        {l.status !== "Converted" && (
                           <Link href={`/members/new?leadId=${l.id}`} title="Convert to Member" className="btn-ghost btn-sm">
                             <ArrowRight className="h-4 w-4" />
                           </Link>
                        )}
                        <ActionButton action={deleteLead} fields={{ id: l.id }} className="text-red-500 hover:text-red-700" confirm="Delete this lead?">Delete</ActionButton>
                      </div>
                   </td>
                 </tr>
               ))}
               {leads.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">No leads found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
