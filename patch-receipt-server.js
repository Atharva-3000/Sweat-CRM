const fs = require('fs');
let code = fs.readFileSync('app/receipts/[paymentId]/page.tsx', 'utf8');

// I need to import formatINR
if (!code.includes('formatINR')) {
  code = code.replace(
    'import { notFound } from "next/navigation";',
    'import { notFound } from "next/navigation";\nimport { formatINR } from "@/lib/dates";'
  );
}

// And update receiptData to include formatted strings
const dataBlock = `  const receiptData = {
    gymName: s.gymName,
    gstEnabled: s.gstEnabled,
    gstNumber: s.gstNumber,
    sacCode: s.sacCode,
    gstRate: s.gstRate,
    branchName: branch?.name || "Main Branch",
    branchAddress: branch?.address || "",
    branchPhone: branch?.phone || "",
    receiptNo: payment.id,
    date: payment.date,
    memberId: member.id,
    memberName: member.name,
    memberPhone: member.phone,
    paymentMethod: payment.method,
    paymentType: payment.type,
    amountFormatted: formatINR(payment.amount),
    taxableAmountFormatted: formatINR(taxableAmount),
    cgstAmountFormatted: formatINR(cgstAmount),
    sgstAmountFormatted: formatINR(sgstAmount),
    note: payment.note,
  };`;

code = code.replace(/  const receiptData = \{[\s\S]*?note: payment\.note,\n  \};/, dataBlock);

fs.writeFileSync('app/receipts/[paymentId]/page.tsx', code);
