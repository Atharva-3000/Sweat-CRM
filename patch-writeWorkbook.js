const fs = require('fs');
let code = fs.readFileSync('lib/db.ts', 'utf8');

code = code.replace(
  /...db\[table\]\.slice/g,
  '...((db[table] || []) as any[]).slice'
);
code = code.replace(
  /ws\.addRows\(db\[table\]/g,
  'ws.addRows((db[table] || [])'
);

fs.writeFileSync('lib/db.ts', code);
