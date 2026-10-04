const fs = require('fs');
let code = fs.readFileSync('app/(admin)/settings/page.tsx', 'utf8');

// Remove the old GST field
code = code.replace(
  /               <div>\s*<label className="label">GST Number \(For Receipts\)<\/label>\s*<input name="gstNumber" className="input" defaultValue=\{s.gstNumber\} placeholder="22AAAAA0000A1Z5" \/>\s*<\/div>\n\n/m,
  ''
);

// Add a new section for Billing & GST
const newSection = `            <div className="space-y-4 pt-4">
               <h3 className="font-medium text-lg border-b border-slate-100 dark:border-white/[0.08] pb-2">Billing & GST</h3>
               
               <div className="flex items-center gap-2">
                 <input type="checkbox" id="gstEnabled" name="gstEnabled" defaultChecked={s.gstEnabled} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600" />
                 <label htmlFor="gstEnabled" className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable GST on Receipts</label>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="label">GST Number</label>
                   <input name="gstNumber" className="input" defaultValue={s.gstNumber} placeholder="22AAAAA..." />
                 </div>
                 <div>
                   <label className="label">Default GST Rate (%)</label>
                   <input name="gstRate" type="number" min="0" max="100" className="input" defaultValue={s.gstRate} placeholder="18" />
                 </div>
               </div>
               
               <div>
                 <label className="label">SAC Code (Services Accounting Code)</label>
                 <input name="sacCode" className="input" defaultValue={s.sacCode} placeholder="999723" />
                 <p className="text-xs text-slate-500 mt-1">Standard fitness center SAC is typically 999723. Confirm with your CA.</p>
               </div>
            </div>\n\n`;

code = code.replace(
  '            <div className="space-y-4 pt-4">\n               <h3 className="font-medium text-lg border-b border-slate-100 dark:border-white/[0.08] pb-2">Admin Security</h3>',
  newSection + '            <div className="space-y-4 pt-4">\n               <h3 className="font-medium text-lg border-b border-slate-100 dark:border-white/[0.08] pb-2">Admin Security</h3>'
);

fs.writeFileSync('app/(admin)/settings/page.tsx', code);
