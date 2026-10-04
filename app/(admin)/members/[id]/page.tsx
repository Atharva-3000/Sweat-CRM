import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Card, PageHeader, StatusBadge, Avatar, EmptyState } from "@/components/ui";
import { formatINR, today } from "@/lib/dates";
import { displayStatus, settingsOf } from "@/lib/queries";
import { ContactButtons } from "@/components/contact-buttons";
import { ActionButton, ModalForm } from "@/components/action-form";
import { renewMembership, recordPayment, freezeMember, unfreezeMember, setMemberCancelled, deleteMember, checkIn } from "@/app/actions";

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: memberData } = await supabase.from('members').select('*').eq('id', id).single();
  const m = memberData;
  if (!m) notFound();

  const s = await settingsOf();
  const T = today();
  const status = displayStatus(m, s.reminderDays, T);
  
  const { data: plan } = await supabase.from('plans').select('*').eq('id', m.planId).single();
  const { data: branch } = await supabase.from('branches').select('*').eq('id', m.branchId).single();
  const { data: trainer } = await supabase.from('staff').select('*').eq('id', m.trainerId).maybeSingle();
  const { data: plansData } = await supabase.from('plans').select('*').eq('active', true);
  const plans = plansData || [];

  const { data: paymentsData } = await supabase.from('payments').select('*').eq('memberId', m.id).order('id', { ascending: false });
  const payments = paymentsData || [];
  
  const { data: attendanceData } = await supabase.from('attendance').select('*').eq('memberId', m.id).order('id', { ascending: false }).limit(10);
  const attendance = attendanceData || [];
  
  const hasCheckedInToday = attendance.some(a => a.date === T);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={m.name} 
        subtitle={
           <span className="flex items-center gap-2">
             {m.id} · {branch?.name} <StatusBadge status={status} />
           </span>
        }
        actions={
          <>
             {!hasCheckedInToday && (status === "active" || status === "expiring") && (
                <ActionButton action={checkIn} fields={{ member: m.id }} className="btn-primary">
                  Check In Now
                </ActionButton>
             )}
             {status === "frozen" ? (
               <ActionButton action={unfreezeMember} fields={{ id: m.id }} confirm="Unfreeze membership? Days frozen will be added to the end date.">Unfreeze</ActionButton>
             ) : (
               <ActionButton action={freezeMember} fields={{ id: m.id }} confirm="Freeze this membership?">Freeze</ActionButton>
             )}
             
             {status === "cancelled" ? (
                <ActionButton action={setMemberCancelled} fields={{ id: m.id, cancel: "0" }}>Reactivate</ActionButton>
             ) : (
                <ActionButton action={setMemberCancelled} fields={{ id: m.id, cancel: "1" }} className="btn-danger btn-sm" confirm="Cancel this membership?">Cancel Membership</ActionButton>
             )}
             
             <ModalForm
                trigger="Renew"
                title="Renew Membership"
                action={renewMembership}
             >
                <input type="hidden" name="id" value={m.id} />
                <div className="space-y-4">
                  <div>
                    <label className="label">Plan</label>
                    <select name="planId" required className="input" defaultValue={m.planId}>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Start Date</label>
                    <input name="startDate" type="date" required className="input" defaultValue={m.endDate < T ? T : m.endDate} />
                  </div>
                  <div>
                    <label className="label">Amount Paid Now</label>
                    <input name="amountPaid" type="number" min="0" className="input" />
                  </div>
                  <div>
                    <label className="label">Discount</label>
                    <input name="discount" type="number" min="0" defaultValue="0" className="input" />
                  </div>
                   <div>
                    <label className="label">Payment Method</label>
                    <select name="method" className="input">
                      <option>UPI</option>
                      <option>Cash</option>
                      <option>Card</option>
                      <option>Bank Transfer</option>
                    </select>
                  </div>
                </div>
             </ModalForm>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
           <Card title="Membership Details">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Plan</p>
                   <p className="font-medium">{plan?.name || "Unknown"}</p>
                 </div>
                  <div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Period</p>
                   <p className="font-medium">{m.startDate} to {m.endDate}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Assigned Trainer</p>
                   <p className="font-medium">{trainer?.name || "None"}</p>
                 </div>
                 {m.frozenOn && (
                    <div>
                     <p className="text-xs text-slate-500 dark:text-slate-400">Frozen Since</p>
                     <p className="font-medium">{m.frozenOn}</p>
                   </div>
                 )}
              </div>
           </Card>

           <Card 
             title="Payment History"
             actions={
                m.balanceDue > 0 ? (
                  <ModalForm
                    trigger={`Receive ₹${m.balanceDue} Due`}
                    triggerClassName="btn-primary btn-sm"
                    title="Record Due Payment"
                    action={recordPayment}
                  >
                     <input type="hidden" name="id" value={m.id} />
                     <div className="space-y-4">
                        <div>
                          <label className="label">Amount</label>
                          <input name="amount" type="number" min="1" max={m.balanceDue} defaultValue={m.balanceDue} required className="input" />
                        </div>
                        <div>
                          <label className="label">Method</label>
                          <select name="method" className="input">
                            <option>UPI</option>
                            <option>Cash</option>
                            <option>Card</option>
                          </select>
                        </div>
                     </div>
                  </ModalForm>
                ) : null
             }
             bodyClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 dark:bg-white/[0.02]">
                      <th className="th">Date</th>
                      <th className="th">Amount</th>
                      <th className="th">Type</th>
                      <th className="th">Method</th>
                      <th className="th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {payments.map(p => (
                       <tr key={p.id}>
                         <td className="td text-slate-500 dark:text-slate-400">{p.date}</td>
                         <td className="td font-medium">{formatINR(p.amount)}</td>
                         <td className="td text-slate-500 dark:text-slate-400">{p.type}</td>
                         <td className="td text-slate-500 dark:text-slate-400">{p.method}</td>
                         <td className="td text-right">
                           <div className="flex flex-col items-end gap-1">
                             <a href={`/receipts/${p.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                               Print Receipt
                             </a>
                             <span className="text-[10px] text-slate-400 font-mono" title="Verification Code">
                               Ver: {String(p.id).split('').map((c: string) => c.charCodeAt(0).toString(16)).join('').slice(0, 6).toUpperCase()}
                             </span>
                           </div>
                         </td>
                       </tr>
                     ))}
                     {payments.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-slate-500 dark:text-slate-400">No payments found.</td></tr>}
                  </tbody>
                </table>
              </div>
           </Card>
           
           <Card title="Recent Check-ins" bodyClassName="p-0">
               {attendance.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {attendance.map(a => (
                       <div key={a.id} className="flex justify-between px-4 py-3 text-sm">
                         <span>{a.date}</span>
                         <span className="text-slate-500 dark:text-slate-400">{a.time}</span>
                       </div>
                    ))}
                  </div>
               ) : (
                 <EmptyState>No recent check-ins.</EmptyState>
               )}
           </Card>
        </div>

        <div className="space-y-6">
           <Card>
              <div className="flex flex-col items-center text-center">
                 <Avatar name={m.name} size="lg" />
                 <h2 className="mt-4 text-lg font-semibold">{m.name}</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400">{m.phone}</p>
                 {m.email && <p className="text-sm text-slate-500 dark:text-slate-400">{m.email}</p>}
                 
                 <div className="mt-4">
                   <ContactButtons contact={{ name: m.name, phone: m.phone, email: m.email, refId: m.id, refType: "member" }} template={status === "expiring" ? "expiry" : status === "expired" ? "expired" : "custom"} size="md" />
                 </div>
              </div>
              <div className="mt-6 border-t border-slate-100 pt-4 space-y-3 text-sm">
                 <div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Date of Birth</p>
                   <p>{m.dob || "—"}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                   <p>{m.address || "—"}</p>
                 </div>
                  <div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Emergency Contact</p>
                   <p>{m.emergencyContact || "—"}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Follow-up Date</p>
                   <p className={m.followUpDate ? "font-medium text-amber-600 dark:text-amber-500" : ""}>{m.followUpDate ? new Date(m.followUpDate).toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"}) : "—"}</p>
                 </div>
                  {m.notes && (
                   <div>
                     <p className="text-xs text-slate-500 dark:text-slate-400">Notes</p>
                     <p className="text-slate-700">{m.notes}</p>
                   </div>
                 )}
              </div>
           </Card>

           <div className="text-center">
              <ActionButton action={deleteMember} fields={{ id: m.id }} className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700" confirm="Permanently delete this member?">
                Delete Member
              </ActionButton>
           </div>
        </div>
      </div>
    </div>
  );
}
