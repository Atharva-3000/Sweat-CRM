const fs = require('fs');
let code = fs.readFileSync('app/(admin)/members/[id]/page.tsx', 'utf8');

const regex = /<td className="td text-right">\s*<a href=\{\`\/receipts\/\$\{p\.id\}\`\} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">\s*Print Receipt\s*<\/a>\s*<\/td>/g;

const replacement = `<td className="td text-right">
                           <div className="flex flex-col items-end gap-1">
                             <a href={\`/receipts/\${p.id}\`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                               Print Receipt
                             </a>
                             <span className="text-[10px] text-slate-400 font-mono" title="Verification Code">
                               Ver: {p.id.split('').map((c) => c.charCodeAt(0).toString(16)).join('').slice(0, 6).toUpperCase()}
                             </span>
                           </div>
                         </td>`;

code = code.replace(regex, replacement);

fs.writeFileSync('app/(admin)/members/[id]/page.tsx', code);
