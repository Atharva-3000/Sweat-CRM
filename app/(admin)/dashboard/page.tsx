import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { getBranchScope } from "@/lib/auth";
import { memberViews } from "@/lib/queries";
import { formatINR, lastNMonths, monthKey, today } from "@/lib/dates";
import { Activity, CreditCard, Users, UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ContactButtons } from "@/components/contact-buttons";
import { RevenueChart, type RevenueMonthItem } from "@/components/revenue-chart";

export default async function Dashboard() {
  const scope = await getBranchScope();
  const mViews = await memberViews(scope);
  const T = today();

  const activeMembers = mViews.filter((m) => m.display === "active").length;
  
  let attendanceQuery = supabase.from('attendance').select('*').eq('date', T);
  if (scope !== "all") attendanceQuery = attendanceQuery.eq('branchId', scope);
  const { data: attendanceData } = await attendanceQuery;
  const checkinsToday = (attendanceData || []).length;
  
  // Revenue this month
  const thisMonth = monthKey(T);
  let paymentsQuery = supabase.from('payments').select('*').like('date', `${thisMonth}%`);
  if (scope !== "all") paymentsQuery = paymentsQuery.eq('branchId', scope);
  const { data: paymentsThisMonth } = await paymentsQuery;
  const revenueThisMonth = (paymentsThisMonth || []).reduce((acc: any, p: any) => acc + p.amount, 0);

  let leadsQuery = supabase.from('leads').select('*').in('status', ['New', 'Contacted']);
  if (scope !== "all") leadsQuery = leadsQuery.eq('branchId', scope);
  const { data: leadsData } = await leadsQuery;
  const newLeads = (leadsData || []).length;

  // Chart data: revenue last 6 months
  const months = lastNMonths(6, T);
  
  const [{ data: allPayments }, { data: plansData }] = await Promise.all([
    scope !== "all"
      ? supabase.from('payments').select('*').eq('branchId', scope).order('date', { ascending: false })
      : supabase.from('payments').select('*').order('date', { ascending: false }),
    supabase.from('plans').select('id, name'),
  ]);
  const payments = allPayments || [];
  const planMap = new Map((plansData || []).map((p: any) => [p.id, p.name]));
  const memberMap = new Map(mViews.map((m) => [m.id, m]));

  const revData: RevenueMonthItem[] = months.map((m) => {
    const monthPayments = payments
      .filter((p: any) => p.date.startsWith(m))
      .map((p: any) => {
        const mem = memberMap.get(p.memberId);
        return {
          id: p.id,
          date: p.date,
          amount: p.amount,
          method: p.method || "Cash",
          type: p.type || "New",
          note: p.note || "",
          memberId: p.memberId,
          memberName: mem?.name || p.memberId || "Unknown Member",
          memberPhone: mem?.phone || "",
          planName: planMap.get(p.planId) || mem?.planName || "—",
        };
      });

    const amount = monthPayments.reduce((acc, p) => acc + p.amount, 0);

    // Members who got admission (joined in this month OR had a "New" admission payment in this month)
    const admittedMemberIds = new Set<string>();
    const admissions = [];

    for (const mem of mViews) {
      if ((mem.joinDate && mem.joinDate.startsWith(m)) || (mem.startDate && mem.startDate.startsWith(m))) {
        admittedMemberIds.add(mem.id);
        const paidInMonth = monthPayments
          .filter((p) => p.memberId === mem.id && p.type === "New")
          .reduce((acc, p) => acc + p.amount, 0);
        admissions.push({
          id: mem.id,
          name: mem.name,
          phone: mem.phone,
          planName: mem.planName,
          joinDate: mem.joinDate || mem.startDate,
          display: mem.display,
          amountPaid: paidInMonth,
        });
      }
    }

    for (const p of monthPayments) {
      if (p.type === "New" && !admittedMemberIds.has(p.memberId)) {
        admittedMemberIds.add(p.memberId);
        const mem = memberMap.get(p.memberId);
        admissions.push({
          id: p.memberId,
          name: p.memberName,
          phone: p.memberPhone,
          planName: p.planName,
          joinDate: p.date,
          display: mem?.display || "active",
          amountPaid: p.amount,
        });
      }
    }

    const date = new Date(`${m}-01T00:00:00`);
    return {
      monthKey: m,
      label: date.toLocaleDateString("en-US", { month: "short" }),
      fullLabel: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      value: amount,
      payments: monthPayments,
      admissions,
    };
  });

  // Recent activity (Check-ins)
  let recentAttendanceQuery = supabase.from('attendance').select('*').order('id', { ascending: false }).limit(5);
  if (scope !== "all") recentAttendanceQuery = recentAttendanceQuery.eq('branchId', scope);
  const { data: recentAttendanceData } = await recentAttendanceQuery;

  const recentCheckins = (recentAttendanceData || [])
    .map((a: any) => {
      const m = mViews.find((m) => m.id === a.memberId);
      return { ...a, memberName: m?.name || "Unknown" };
    });

  // Expiring soon
  const expiring = mViews
    .filter((m) => m.display === "expiring")
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);
    
  let branchesQuery = supabase.from('branches').select('*');
  const { data: branchesData } = await branchesQuery;
  const branches = branchesData || [];

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <PageHeader title="Dashboard" subtitle={`Overview for ${scope === "all" ? "all branches" : branches.find((b: any) => b.id === scope)?.name}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Members" value={activeMembers} icon={<Users className="h-5 w-5" />} tone="indigo" />
        <StatCard label="Check-ins Today" value={checkinsToday} icon={<Activity className="h-5 w-5" />} tone="green" />
        <StatCard label="Revenue This Month" value={formatINR(revenueThisMonth)} icon={<CreditCard className="h-5 w-5" />} tone="amber" />
        <StatCard label="New Leads" value={newLeads} icon={<UserPlus className="h-5 w-5" />} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Revenue (Last 6 Months)" className="lg:col-span-2">
          <RevenueChart data={revData} height={250} />
        </Card>

        <Card title="Expiring Soon" actions={<Link href="/renewals" className="btn-ghost btn-sm">View all <ArrowRight className="h-3 w-3" /></Link>} bodyClassName="p-0">
          {expiring.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {expiring.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 p-4 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={m.name} size="sm" />
                    <div className="min-w-0">
                      <Link href={`/members/${m.id}`} className="block truncate text-sm font-medium hover:underline">{m.name}</Link>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{m.daysLeft} days left</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ContactButtons contact={{ name: m.name, phone: m.phone, email: m.email, refId: m.id, refType: "member" }} template="expiry" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No members expiring soon.</EmptyState>
          )}
        </Card>

        <Card title="Recent Check-ins" actions={<Link href="/attendance" className="btn-ghost btn-sm">View all <ArrowRight className="h-3 w-3" /></Link>} className="lg:col-span-3" bodyClassName="p-0">
          {recentCheckins.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {recentCheckins.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 p-4 min-w-0">
                   <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={a.memberName} size="sm" />
                    <div className="min-w-0">
                       <Link href={`/members/${a.memberId}`} className="block truncate text-sm font-medium hover:underline">{a.memberName}</Link>
                       <p className="truncate text-xs text-slate-500 dark:text-slate-400">{a.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <EmptyState>No recent check-ins.</EmptyState>
          )}
        </Card>
      </div>
    </div>
  );
}
