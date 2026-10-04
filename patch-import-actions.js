const fs = require('fs');
let code = fs.readFileSync('app/actions-import.ts', 'utf8');

code = code.replace('import { guarded } from "@/lib/auth";', 'import { requireAdmin } from "@/lib/auth";');

const guardedImpl = `async function guarded(fn: () => Promise<any>): Promise<any> {
  await requireAdmin();
  try {
    return await fn();
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}`;

code = code.replace(
  'import { addDays, today } from "@/lib/dates";',
  'import { addDays, today } from "@/lib/dates";\n\n' + guardedImpl
);

fs.writeFileSync('app/actions-import.ts', code);
