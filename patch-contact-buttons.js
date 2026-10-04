const fs = require('fs');

let code = fs.readFileSync('components/contact-buttons.tsx', 'utf8');

code = code.replace(
  '<a href={`tel:+${intlPhone}`} className="font-mono text-sm text-indigo-600 dark:text-indigo-400 hover:underline">+${app.countryCode} ${contact.phone}</a>',
  '<a href={`tel:+${intlPhone}`} className="font-mono text-sm text-indigo-600 dark:text-indigo-400 hover:underline">+{app.countryCode} {contact.phone}</a>'
);

fs.writeFileSync('components/contact-buttons.tsx', code);
