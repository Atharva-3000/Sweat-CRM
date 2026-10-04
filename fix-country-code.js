const { readFileSync, writeFileSync } = require('fs');

async function fixDb() {
  const code = `
import { getDb, writeDb } from './lib/db';
async function run() {
  const db = await getDb();
  const setting = db.settings.find(s => s.key === 'countryCode');
  if (setting) {
    console.log("Old setting:", setting.value);
    setting.value = '91';
    await writeDb(db);
    console.log("Fixed country code to 91!");
  }
}
run();
`;
  writeFileSync('fix.ts', code);
}
fixDb();
