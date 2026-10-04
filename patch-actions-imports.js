const fs = require('fs');
let code = fs.readFileSync('app/actions.ts', 'utf8');

code = code.replace(
  'import { mutate, nextId, resetDb } from "@/lib/db";',
  'import { getDb, mutate, nextId, resetDb } from "@/lib/db";'
);

fs.writeFileSync('app/actions.ts', code);
