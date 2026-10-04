const fs = require('fs');
let code = fs.readFileSync('app/actions.ts', 'utf8');

code = code.replace(
  /export async function searchMembers\(query: string\) \{\n  await requireAdmin\(\);\n  if \(\!query \|\| query\.length < 1\) return \[\];\n  const q = query\.toLowerCase\(\);\n  return mutate\(db => \{\n    return db\.members\n      \.filter\(m => m\.name\.toLowerCase\(\)\.includes\(q\) \|\| m\.phone\.includes\(q\) \|\| m\.id\.toLowerCase\(\)\.includes\(q\)\)\n      \.map\(m => \(\{ id: m\.id, name: m\.name, phone: m\.phone, status: displayStatus\(m, settingsOf\(db\)\.reminderDays\) \}\)\)\n      \.slice\(0, 8\);\n  \}\);\n\}/g,
  `export async function searchMembers(query: string) {
  await requireAdmin();
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  const db = await getDb();
  return db.members
    .filter(m => m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.id.toLowerCase().includes(q))
    .map(m => ({ id: m.id, name: m.name, phone: m.phone, status: displayStatus(m, settingsOf(db).reminderDays) }))
    .slice(0, 8);
}`
);

fs.writeFileSync('app/actions.ts', code);
