const fs = require('fs');
let code = fs.readFileSync('app/receipts/[paymentId]/receipt-client.tsx', 'utf8');

// remove items-end that might cause alignment issues in print
code = code.replace(
  'className="flex justify-between items-end mb-8"',
  'className="flex justify-between items-start mb-8 print:block"'
);

// force block on the details grid children for print
code = code.replace(
  '<div>\n             <h3 className="text-xs font-bold',
  '<div className="print:mb-4 print:float-left">\n             <h3 className="text-xs font-bold'
);

code = code.replace(
  '<div className="text-right">',
  '<div className="text-right print:text-left print:float-right">'
);

// clear floats before table
code = code.replace(
  '<table className="w-full text-left border-collapse mb-8">',
  '<div className="clear-both hidden print:block mb-4"></div>\n        <table className="w-full text-left border-collapse mb-8 print:table-fixed">'
);

fs.writeFileSync('app/receipts/[paymentId]/receipt-client.tsx', code);
