import { supabase } from "@/lib/supabase";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { today } from "@/lib/dates";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { checkIn } from "@/app/actions";
import Link from "next/link";
import { Avatar } from "@/components/ui";

export default async function AttendancePage() {
  const { data: _membersData } = await supabase.from('members').select('*');
  const _members = _membersData || [];
  const { data: _attendanceData } = await supabase.from('attendance').select('*');
  const _attendance = _attendanceData || [];
  const scope = await getBranchScope();
  const T = today();

  const members = _members.filter(m => scope === "all" || m.branchId === scope);
  
  const attendanceToday = _attendance
    .filter(a => (scope === "all" || a.branchId === scope) && a.date === T)
    .sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle={`Check-ins for ${T}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Quick Check-in">
           <ActionForm action={checkIn} className="space-y-4">
              <input type="hidden" name="date" value={T} />
              <div>
                <label className="label">Select Member</label>
                <select name="member" required className="input">
                  <option value="">Search member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                  ))}
                </select>
              </div>
              <SubmitButton className="w-full">Record Check-in</SubmitButton>
           </ActionForm>
        </Card>

        <Card title="Today's Check-ins" bodyClassName="p-0" className="lg:col-span-2">
           <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {attendanceToday.map(a => {
                 const m = members.find(mx => mx.id === a.memberId);
                 if (!m) return null;
                 return (
                   <div key={a.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} size="sm" />
                        <div>
                          <Link href={`/members/${m.id}`} className="text-sm font-medium hover:underline">{m.name}</Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{m.phone}</p>
                        </div>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{a.time}</div>
                   </div>
                 );
              })}
              {attendanceToday.length === 0 && <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No check-ins yet today.</div>}
           </div>
        </Card>
      </div>
    </div>
  );
}
