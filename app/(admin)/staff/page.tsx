import { supabase } from "@/lib/supabase";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader, Avatar, Badge } from "@/components/ui";

export default async function StaffPage() {
  const { data: _staffData } = await supabase.from('staff').select('*');
  const _staff = _staffData || [];
  const { data: _branchesData } = await supabase.from('branches').select('*');
  const _branches = _branchesData || [];
  const scope = await getBranchScope();
  
  const staff = _staff.filter(s => scope === "all" || s.branchId === scope);
  const branches = _branches;

  return (
    <div className="space-y-6">
      <PageHeader title="Staff & Trainers" />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {staff.map(s => {
           const branch = branches.find(b => b.id === s.branchId);
           return (
             <Card key={s.id} className={!s.active ? "opacity-60" : ""}>
               <div className="flex flex-col items-center text-center">
                  <Avatar name={s.name} size="md" />
                  <h3 className="font-medium mt-3">{s.name}</h3>
                  <div className="mt-1"><Badge>{s.role}</Badge></div>
                  
                  <div className="mt-4 w-full text-sm space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Phone</span>
                      <span>{s.phone}</span>
                    </div>
                    {scope === "all" && (
                       <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Branch</span>
                        <span>{branch?.name || "Global"}</span>
                      </div>
                    )}
                  </div>
               </div>
             </Card>
           );
        })}
      </div>
       <p className="text-sm text-slate-500 text-center py-8">Staff management requires owner access.</p>
    </div>
  );
}
