const fs = require('fs');
let code = fs.readFileSync('app/actions.ts', 'utf8');

code = code.replace(
  'for (const key of ["gymName", "ownerName", "reminderDays", "countryCode", "dbProvider", "googleSheetId", "senderEmail", "gstNumber"]) {',
  'for (const key of ["gymName", "ownerName", "reminderDays", "countryCode", "dbProvider", "googleSheetId", "senderEmail", "gstNumber", "gstRate", "sacCode"]) {'
);

// add logic for gstEnabled checkbox
code = code.replace(
  'const value = str(fd, key);',
  'const value = str(fd, key);'
);

if (!code.includes('gstEnabled')) {
  code = code.replace(
    'else db.settings.push({ key, value });\n      }',
    'else db.settings.push({ key, value });\n      }\n      \n      const gstEnabled = fd.get("gstEnabled") === "on" ? "true" : "false";\n      const row = db.settings.find((s) => s.key === "gstEnabled");\n      if (row) row.value = gstEnabled;\n      else db.settings.push({ key: "gstEnabled", value: gstEnabled });'
  );
}

fs.writeFileSync('app/actions.ts', code);
