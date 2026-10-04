const fs = require('fs');
let code = fs.readFileSync('app/receipts/[paymentId]/receipt-client.tsx', 'utf8');

code = code.replace(
  /className="max-w-2xl mx-auto bg-white p-10 border border-slate-200 shadow-sm print:border-none print:shadow-none print:w-full print:max-w-full print:p-4 rounded-xl outline-none"\s+contentEditable=\{true\}\s+suppressContentEditableWarning=\{true\}/g,
  'className="max-w-2xl mx-auto bg-white p-10 border border-slate-200 shadow-sm print:block print:border-none print:shadow-none print:w-full print:max-w-full print:p-0 rounded-xl"'
);

// Remove the tip
code = code.replace(
  /<p className="text-center text-sm text-slate-500 mb-4 print:hidden">\s*💡 Tip: You can click anywhere on the receipt to edit the text before printing\.\s*<\/p>/g,
  ''
);

// Add print:min-h-0 
code = code.replace(
  'className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white font-sans text-slate-900"',
  'className="min-h-screen print:min-h-0 bg-slate-100 p-8 print:p-0 print:bg-white font-sans text-slate-900"'
);

fs.writeFileSync('app/receipts/[paymentId]/receipt-client.tsx', code);
