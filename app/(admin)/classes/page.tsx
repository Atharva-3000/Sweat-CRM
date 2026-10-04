import { supabase } from "@/lib/supabase";
import { getBranchScope } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ModalForm, ActionButton } from "@/components/action-form";
import { saveClass, deleteClass } from "@/app/actions";
import { Users } from "lucide-react";
import { WEEK_DAYS } from "@/lib/types";

export default async function ClassesPage() {
  const { data: _classesData } = await supabase.from('classes').select('*');
  const _classes = _classesData || [];
  const { data: _staffData } = await supabase.from('staff').select('*');
  const _staff = _staffData || [];
  const { data: _branchesData } = await supabase.from('branches').select('*');
  const _branches = _branchesData || [];
  const scope = await getBranchScope();

  const classes = _classes.filter(c => scope === "all" || c.branchId === scope);
  const trainers = _staff.filter(s => s.role === "Trainer" && s.active && (scope === "all" || s.branchId === scope));
  const branches = _branches;

  const days = WEEK_DAYS;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Classes & Schedule" 
        actions={
           <ModalForm trigger="Add Class" title="New Class" action={saveClass}>
             <div className="space-y-4">
                <div>
                  <label className="label">Class Name</label>
                  <input name="name" required className="input" placeholder="e.g. Yoga, Zumba" />
                </div>
                <div>
                  <label className="label">Trainer</label>
                  <select name="trainerId" required className="input">
                     {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Day of Week</label>
                  <select name="day" required className="input">
                     {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Start Time</label>
                    <input type="time" name="time" required className="input" />
                  </div>
                   <div>
                    <label className="label">Duration (Mins)</label>
                    <input type="number" name="durationMin" required className="input" defaultValue="60" />
                  </div>
                </div>
                <div>
                  <label className="label">Capacity</label>
                  <input type="number" name="capacity" defaultValue="20" required className="input" />
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {days.map(day => {
          const dayClasses = classes.filter(c => c.day === day).sort((a, b) => a.time.localeCompare(b.time));
          if (dayClasses.length === 0) return null;

          return (
            <Card key={day} title={day} bodyClassName="p-0">
               <div className="divide-y divide-slate-100">
                  {dayClasses.map(c => {
                     const trainer = _staff.find(s => s.id === c.trainerId);
                     return (
                        <div key={c.id} className="p-4 relative group">
                           <div className="font-medium">{c.name}</div>
                           <div className="text-xs text-slate-500 mt-1">{c.time} ({c.durationMin} mins)</div>
                           <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Users className="h-3 w-3" /> {trainer?.name || "Unknown"} (Max {c.capacity})
                           </div>
                           <ActionButton 
                             action={deleteClass} 
                             fields={{ id: c.id }} 
                             className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs transition-opacity"
                             confirm="Delete this class?"
                           >
                              Delete
                           </ActionButton>
                        </div>
                     );
                  })}
               </div>
            </Card>
          );
        })}
      </div>
      {classes.length === 0 && <div className="text-center py-12 text-slate-500 dark:text-slate-400">No classes scheduled.</div>}
    </div>
  );
}
