const fs = require('fs');

let code = fs.readFileSync('app/login/login-form.tsx', 'utf8');

code = code.replace(
  'value={email}',
  'value={email || ""}'
);

code = code.replace(
  'value={otp}',
  'value={otp || ""}'
);

fs.writeFileSync('app/login/login-form.tsx', code);
