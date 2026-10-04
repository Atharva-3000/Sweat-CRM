import { BarChart, Card, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { getBranchScope } from "@/lib/auth";
import { memberViews, settingsOf } from "@/lib/queries";
import { formatINR, lastNMonths, monthKey, today } from "@/lib/dates";
import { Activity, CreditCard, Users, UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ContactButtons } from "@/components/contact-buttons";

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
  
  let allPaymentsQuery = supabase.from('payments').select('*');
  if (scope !== "all") allPaymentsQuery = allPaymentsQuery.eq('branchId', scope);
  const { data: allPayments } = await allPaymentsQuery;
  const payments = allPayments || [];

  const revData = months.map((m) => {
    const amount = payments
      .filter((p: any) => p.date.startsWith(m))
      .reduce((acc: any, p: any) => acc + p.amount, 0);
    const date = new Date(`${m}-01`);
    return { label: date.toLocaleDateString("en-US", { month: "short" }), value: amount };
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
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`Overview for ${scope === "all" ? "all branches" : branches.find((b: any) => b.id === scope)?.name}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Members" value={activeMembers} icon={<Users className="h-5 w-5" />} tone="indigo" />
        <StatCard label="Check-ins Today" value={checkinsToday} icon={<Activity className="h-5 w-5" />} tone="green" />
        <StatCard label="Revenue This Month" value={formatINR(revenueThisMonth)} icon={<CreditCard className="h-5 w-5" />} tone="amber" />
        <StatCard label="New Leads" value={newLeads} icon={<UserPlus className="h-5 w-5" />} tone="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Revenue (Last 6 Months)" className="lg:col-span-2">
          <BarChart data={revData} format={formatINR} height={250} />
        </Card>

        <Card title="Expiring Soon" actions={<Link href="/renewals" className="btn-ghost btn-sm">View all <ArrowRight className="h-3 w-3" /></Link>} bodyClassName="p-0">
          {expiring.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {expiring.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} size="sm" />
                    <div>
                      <Link href={`/members/${m.id}`} className="text-sm font-medium hover:underline">{m.name}</Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{m.daysLeft} days left</p>
                    </div>
                  </div>
                  <ContactButtons contact={{ name: m.name, phone: m.phone, email: m.email, refId: m.id, refType: "member" }} template="expiry" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No members expiring soon.</EmptyState>
          )}
        </Card>

        <Card title="Recent Check-ins" actions={<Link href="/attendance" className="btn-ghost btn-sm">View all <ArrowRight className="h-3 w-3" /></Link>} bodyClassName="p-0 lg:col-span-3">
          {recentCheckins.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentCheckins.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4">
                   <div className="flex items-center gap-3">
                    <Avatar name={a.memberName} size="sm" />
                    <div>
                       <Link href={`/members/${a.memberId}`} className="text-sm font-medium hover:underline">{a.memberName}</Link>
                       <p className="text-xs text-slate-500 dark:text-slate-400">{a.time}</p>
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
