const fs = require('fs');
let code = fs.readFileSync('app/actions.ts', 'utf8');

const regex = /const keys = \["gymName", "ownerName", "countryCode"\];/g;
const replacement = 'const keys = ["gymName", "ownerName", "countryCode", "gstNumber", "gstRate"];';
code = code.replace(regex, replacement);

if (!code.includes('const gstEnabled = fd.get("gstEnabled") === "on" ? "true" : "false";')) {
  code = code.replace(
    /const row = db.settings.find\(\(s\) => s.key === "onboardingComplete"\);/g,
    `const gstEnabled = fd.get("gstEnabled") === "on" ? "true" : "false";
      const gstRow = db.settings.find((s) => s.key === "gstEnabled");
      if (gstRow) gstRow.value = gstEnabled;
      else db.settings.push({ key: "gstEnabled", value: gstEnabled });

      const row = db.settings.find((s) => s.key === "onboardingComplete");`
  );
}

fs.writeFileSync('app/actions.ts', code);
