const fs = require('fs');
let code = fs.readFileSync('app/globals.css', 'utf8');
code = code.replace(/@media print \{[\s\S]*\}\n/m, '');
fs.writeFileSync('app/globals.css', code);
