import { supabase } from "@/lib/supabase";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function PlansPage() {
  const { data: _plansData } = await supabase.from('plans').select('*');
  const _plans = _plansData || [];
  await getBranchScope(); // Ensure auth
  
  const plans = _plans;

  return (
    <div className="space-y-6">
      <PageHeader title="Membership Plans" subtitle="Global plans available across all branches. Use these details to explain options to customers." />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(p => {
           const features = p.features ? p.features.split('|') : [];
           return (
             <Card key={p.id} className={`flex flex-col h-full ${!p.active ? "opacity-60" : ""}`}>
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h3 className="font-semibold text-lg">{p.name}</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400">{p.durationDays} days</p>
                 </div>
                 {!p.active && <span className="text-xs bg-slate-100 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full">Inactive</span>}
               </div>
               
               <div className="text-3xl font-bold mb-2">₹{p.price}</div>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{p.description}</p>
               
               <div className="flex-1">
                 <p className="text-sm font-medium text-slate-900 mb-3">Includes:</p>
                 <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                    {features.map((f: string, i: number) => (
                      <li key={i} className="flex gap-2 items-start">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                 </ul>
               </div>
               
               <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.05] text-center">
                 <Link href={`/members/new?planId=${p.id}`} className="btn-primary w-full justify-center">Sell Plan</Link>
               </div>
             </Card>
           );
        })}
      </div>

      <div className="pt-10">
        <h2 className="text-xl font-bold mb-6">Plan Comparison</h2>
        <Card bodyClassName="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:bg-white/[0.02]">
                <th className="th sticky left-0 bg-slate-50 dark:bg-[#27272a] w-48">Feature</th>
                {plans.map(p => (
                   <th key={p.id} className="th text-center">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {[
                 { key: "Gym Access", vals: ["Full", "Full", "Full", "Full", "Full", "Off-peak"] },
                 { key: "Locker Facility", vals: ["Yes", "Yes", "Yes", "Yes", "Yes", "Yes"] },
                 { key: "Diet Consultations", vals: ["—", "1 Free", "2 Free", "Unlimited", "Custom Plan", "—"] },
                 { key: "Free Freeze Days", vals: ["—", "10 Days", "20 Days", "30 Days", "—", "—"] },
                 { key: "Personal Training", vals: ["—", "—", "1 Session", "—", "12 Sessions", "—"] },
                 { key: "Merchandise", vals: ["—", "—", "—", "Gym Bag + T-shirt", "—", "—"] },
                 { key: "Group Classes", vals: ["Paid", "Paid", "Paid", "Free", "Paid", "Paid"] },
               ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="td sticky left-0 bg-white font-medium shadow-[1px_0_0_0_#f1f5f9]">{row.key}</td>
                    {row.vals.map((val, i) => (
                      <td key={i} className="td text-center text-slate-500 dark:text-slate-400">
                        {val === "Yes" ? <CheckCircle2 className="h-4 w-4 text-indigo-500 mx-auto" /> : val === "—" ? <span className="text-slate-300">—</span> : val}
                      </td>
                    ))}
                  </tr>
               ))}
            </tbody>
          </table>
        </Card>
      </div>

      <p className="text-sm text-slate-500 text-center mt-8">Plan management is handled via the gym owner's super-admin view.</p>
    </div>
  );
}
