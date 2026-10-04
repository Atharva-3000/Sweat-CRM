const fs = require('fs');
let code = fs.readFileSync('app/(admin)/members/[id]/page.tsx', 'utf8');

if (!code.includes('Follow-up Date')) {
  code = code.replace(
    '<p>{m.emergencyContact || "—"}</p>\n                 </div>',
    '<p>{m.emergencyContact || "—"}</p>\n                 </div>\n                 <div>\n                   <p className="text-xs text-slate-500 dark:text-slate-400">Follow-up Date</p>\n                   <p className={m.followUpDate ? "font-medium text-amber-600 dark:text-amber-500" : ""}>{m.followUpDate ? new Date(m.followUpDate).toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"}) : "—"}</p>\n                 </div>'
  );
  fs.writeFileSync('app/(admin)/members/[id]/page.tsx', code);
}
