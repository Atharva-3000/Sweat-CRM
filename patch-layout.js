const fs = require('fs');
let code = fs.readFileSync('app/layout.tsx', 'utf8');
code = code.replace(
  'h-full antialiased',
  'h-full print:h-auto antialiased'
);
code = code.replace(
  'min-h-full font-sans',
  'min-h-full print:h-auto print:min-h-0 font-sans'
);
fs.writeFileSync('app/layout.tsx', code);
