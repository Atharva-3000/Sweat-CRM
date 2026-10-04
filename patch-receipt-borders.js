const fs = require('fs');

let code = fs.readFileSync('app/receipts/[paymentId]/receipt-client.tsx', 'utf8');

// Strip outer grey bg and padding on print
code = code.replace(
  'className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans text-slate-900"',
  'className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans text-slate-900 print:bg-white print:p-0"'
);

// Strip rounded corners and borders on inner card during print
code = code.replace(
  'className="max-w-2xl mx-auto bg-white p-6 sm:p-10 border border-slate-200 shadow-sm rounded-xl print-container text-slate-900"',
  'className="max-w-2xl mx-auto bg-white p-6 sm:p-10 border border-slate-200 shadow-sm rounded-xl print-container text-slate-900 print:border-none print:shadow-none print:rounded-none"'
);

// In the style block, let's explicitly remove background from everything inside body just in case
code = code.replace(
  'body {',
  'body, .min-h-screen, .print-container {'
);

fs.writeFileSync('app/receipts/[paymentId]/receipt-client.tsx', code);
