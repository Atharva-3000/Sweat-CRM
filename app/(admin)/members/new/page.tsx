import { getDb } from "@/lib/db";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { createMember } from "@/app/actions";
import { today } from "@/lib/dates";

export default async function NewMemberPage({ searchParams }: { searchParams: Promise<{ leadId?: string; planId?: string }> }) {
  const { leadId, planId } = await searchParams;
  const db = await getDb();
  const scope = await getBranchScope();
  
  const branches = db.branches;
  const plans = db.plans.filter(p => p.active);
  const trainers = db.staff.filter(s => s.role === "Trainer" && s.active);
  
  let lead = null;
  if (leadId) {
    lead = db.leads.find(l => l.id === leadId);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Add New Member" />

      <Card>
        <ActionForm action={createMember} className="space-y-6">
          {leadId && <input type="hidden" name="leadId" value={leadId} />}
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full Name</label>
              <input name="name" required className="input" defaultValue={lead?.name} />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input name="phone" required className="input" defaultValue={lead?.phone} />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input name="email" type="email" className="input" defaultValue={lead?.email} />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input name="dob" type="date" className="input" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select name="gender" className="input">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
             <div>
              <label className="label">Branch</label>
              <select name="branchId" required className="input" defaultValue={lead?.branchId || (scope !== "all" ? scope : undefined)}>
                <option value="">Select branch...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-6">
            <div>
              <label className="label">Membership Plan</label>
              <select name="planId" required className="input" defaultValue={planId}>
                <option value="">Select plan...</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input name="startDate" type="date" required className="input" defaultValue={today()} />
            </div>
             <div>
              <label className="label">Assigned Trainer</label>
              <select name="trainerId" className="input">
                <option value="">None</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 border-t border-slate-100 pt-6">
             <div>
              <label className="label">Amount Paid</label>
              <input name="amountPaid" type="number" min="0" className="input" />
            </div>
            <div>
              <label className="label">Discount</label>
              <input name="discount" type="number" min="0" defaultValue="0" className="input" />
            </div>
             <div>
              <label className="label">Payment Method</label>
              <select name="method" className="input">
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
             <label className="label">Notes</label>
             <textarea name="notes" rows={3} className="input" defaultValue={lead?.notes}></textarea>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
             <SubmitButton>Create Member</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
