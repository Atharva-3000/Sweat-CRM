import { supabase } from "@/lib/supabase";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader, Avatar } from "@/components/ui";
import { today } from "@/lib/dates";
import { memberViews } from "@/lib/queries";
import { QuickCheckIn } from "@/components/quick-checkin";
import Link from "next/link";

export default async function AttendancePage() {
  const scope = await getBranchScope();
  const T = today();
  const [mViews, { data: _attendanceData }] = await Promise.all([
    memberViews(scope),
    supabase.from('attendance').select('*'),
  ]);
  const _attendance = _attendanceData || [];

  const attendanceToday = _attendance
    .filter(a => (scope === "all" || a.branchId === scope) && a.date === T)
    .sort((a, b) => b.time.localeCompare(a.time));

  const checkedInIds = new Set(attendanceToday.map(a => a.memberId));

  const checkInOptions = mViews.map(m => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    display: m.display,
    planName: m.planName,
    checkedInToday: checkedInIds.has(m.id),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle={`Check-ins for ${T}`} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Quick Check-in">
          <QuickCheckIn members={checkInOptions} date={T} />
        </Card>

        <Card title="Today's Check-ins" bodyClassName="p-0" className="lg:col-span-2">
           <div className="divide-y divide-slate-100 dark:divide-white/[0.05] max-h-[500px] overflow-y-auto">
              {attendanceToday.map(a => {
                 const m = mViews.find(mx => mx.id === a.memberId);
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
