const fs = require('fs');
let code = fs.readFileSync('components/shell.tsx', 'utf8');

if (!code.includes('PhoneCall')) {
  code = code.replace(
    'MessageSquare,',
    'MessageSquare,\n  PhoneCall,'
  );
  fs.writeFileSync('components/shell.tsx', code);
}
