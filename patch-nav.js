const fs = require('fs');
let code = fs.readFileSync('components/shell.tsx', 'utf8');

if (!code.includes('href: "/calls"')) {
  code = code.replace(
    '{ href: "/renewals", label: "Renewals & Dues", icon: Bell, badgeKey: "alerts" as const },',
    '{ href: "/renewals", label: "Renewals & Dues", icon: Bell, badgeKey: "alerts" as const },\n  { href: "/calls", label: "Call Logs", icon: PhoneCall },'
  );
  code = code.replace(
    'MessageSquare,',
    'MessageSquare, PhoneCall,'
  );
  fs.writeFileSync('components/shell.tsx', code);
}
