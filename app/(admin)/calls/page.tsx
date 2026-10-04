import { supabase } from "@/lib/supabase";
import { getBranchScope } from "@/lib/auth";
import { PageHeader, Card, EmptyState, Avatar } from "@/components/ui";
import Link from "next/link";
import { PhoneCall, CheckCircle2, AlertCircle } from "lucide-react";
import { today } from "@/lib/dates";

export const metadata = { title: "Call Logs & Queue" };

export default async function CallsPage() {
  const { data: _membersData } = await supabase.from('members').select('*');
  const _members = _membersData || [];
  const { data: _staffData } = await supabase.from('staff').select('*');
  const _staff = _staffData || [];
  const { data: _callLogsData } = await supabase.from('callLogs').select('*');
  const _callLogs = _callLogsData || [];
  const scope = await getBranchScope();
  const T = today();
  
  const membersMap = new Map(_members.map(m => [m.id, m]));
  const staffMap = new Map(_staff.map(s => [s.id, s.name]));

  // Queue: Members who need a follow-up today or earlier, and are not cancelled/frozen
  let queue = _members.filter(m => {
    if (scope !== "all" && m.branchId !== scope) return false;
    if (m.status === "cancelled") return false;
    if (!m.followUpDate) return false;
    // string comparison works for YYYY-MM-DD
    return m.followUpDate <= T;
  });
  
  // Sort queue by followUpDate (oldest first, i.e. most overdue)
  queue.sort((a, b) => a.followUpDate!.localeCompare(b.followUpDate!));

  // History: All call logs
  let logs = _callLogs || [];
  if (scope !== "all") {
    logs = logs.filter(l => {
       const m = membersMap.get(l.memberId);
       return m && m.branchId === scope;
    });
  }
  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const outcomeLabels: Record<string, string> = {
    will_pay: "Will pay later",
    no_answer: "Did not pick up",
    freeze: "Wants to freeze",
    cancel: "Not renewing",
    other: "Other"
  };

  const outcomeColors: Record<string, string> = {
    will_pay: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    no_answer: "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-300",
    freeze: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
    cancel: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
    other: "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-300",
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };
  const formatJustDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Outreach & Call Queue" 
        subtitle="Manage daily follow-ups and track staff accountability." 
      />

      {/* QUEUE SECTION */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-indigo-500" /> Today's Action Queue
          <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 text-xs py-0.5 px-2 rounded-full font-bold">{queue.length}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queue.length === 0 ? (
            <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/[0.05] rounded-xl p-8 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <p className="font-medium">You're all caught up!</p>
              <p className="text-sm">No pending follow-ups scheduled for today.</p>
            </div>
          ) : (
            queue.map(m => (
              <Card key={m.id} className="flex flex-col border-l-4 border-l-indigo-500">
                 <div className="p-4 flex-1">
                   <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-slate-900 dark:text-white">{m.name}</h4>
                     <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.followUpDate! < T ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'}`}>
                       {m.followUpDate! < T ? "Overdue" : "Today"}
                     </span>
                   </div>
                   <p className="text-sm font-mono text-slate-500">{m.phone}</p>
                   {m.notes && <p className="text-xs text-slate-500 mt-3 line-clamp-2 italic">"{m.notes}"</p>}
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.05] flex gap-2">
                   <Link href={`/members/${m.id}`} className="btn-primary w-full text-center py-1.5 text-sm">
                     Open Profile & Call
                   </Link>
                 </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* HISTORY SECTION */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Historical Call Logs</h3>
        <Card>
          {logs.length === 0 ? (
            <EmptyState>
              <PhoneCall className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 font-medium text-lg">No calls logged yet</p>
              <p className="text-slate-400 mt-1">When staff make calls from member profiles, outcomes will appear here.</p>
            </EmptyState>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Date & Time</th>
                    <th className="th">Member</th>
                    <th className="th">Staff / Caller</th>
                    <th className="th">Outcome</th>
                    <th className="th">Notes</th>
                    <th className="th">Follow-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {logs.map((log) => {
                    const m = membersMap.get(log.memberId);
                    const s = log.staffId === "admin" ? "Admin" : (staffMap.get(log.staffId) || log.staffId);
                    
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="td whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="td">
                          {m ? (
                            <Link href={`/members/${m.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                              {m.name}
                            </Link>
                          ) : (
                            <span className="text-slate-500">Unknown Member</span>
                          )}
                        </td>
                        <td className="td font-medium text-slate-900 dark:text-slate-200">
                          {s}
                        </td>
                        <td className="td">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${outcomeColors[log.outcome] || outcomeColors.other}`}>
                            {outcomeLabels[log.outcome] || log.outcome}
                          </span>
                        </td>
                        <td className="td max-w-xs truncate text-slate-600 dark:text-slate-400" title={log.notes}>
                          {log.notes || "-"}
                        </td>
                        <td className="td text-slate-500 dark:text-slate-400">
                          {log.followUpDate ? formatJustDate(log.followUpDate) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
