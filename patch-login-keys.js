const fs = require('fs');
let code = fs.readFileSync('app/login/login-form.tsx', 'utf8');

code = code.replace(
  '<form onSubmit={handleRequestOTP} className="space-y-4">',
  '<form key="email-form" onSubmit={handleRequestOTP} className="space-y-4">'
);

code = code.replace(
  '<form action={action} className="space-y-4">',
  '<form key="password-form" action={action} className="space-y-4">'
);

fs.writeFileSync('app/login/login-form.tsx', code);
