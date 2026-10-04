const fs = require('fs');

let code = fs.readFileSync('app/receipts/[paymentId]/page.tsx', 'utf8');

const generateMetadataCode = `export async function generateMetadata({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const db = await getDb();
  const payment = db.payments.find(p => p.id === paymentId);
  if (!payment) return { title: "Receipt" };
  
  const member = db.members.find(m => m.id === payment.memberId);
  const nameStr = member ? member.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : "member";
  
  // parse YYYY-MM-DD
  let d = new Date(payment.date);
  if (isNaN(d.getTime())) d = new Date(); // fallback
  
  const month = d.toLocaleString('default', { month: 'short' }).toLowerCase();
  const year = d.getFullYear();
  
  return {
    title: \`\${nameStr}-\${month}-\${year}\`
  };
}

export default async function ReceiptPage`;

code = code.replace('export default async function ReceiptPage', generateMetadataCode);

fs.writeFileSync('app/receipts/[paymentId]/page.tsx', code);
