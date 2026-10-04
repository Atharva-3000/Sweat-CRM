const fs = require('fs');
let code = fs.readFileSync('app/receipts/[paymentId]/receipt-client.tsx', 'utf8');

// Generate Auth Code
// wait, we need authCode on the server side or client side. We can just add it to the component.
const newComponent = `export function ReceiptClient({ data }: { data: any }) {
  // Simple deterministic auth code
  const authCode = data.receiptNo.split('').map((c: string) => c.charCodeAt(0).toString(16)).join('').slice(0, 6).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white font-sans text-slate-900">
      
      {/* Controls - Hidden on print */}
      <div className="max-w-2xl mx-auto mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
        <Link href={\`/members/\${data.memberId}\`} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
            Auth Code: {authCode}
          </span>
          <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500 mb-4 print:hidden">
        💡 Tip: You can click anywhere on the receipt to edit the text before printing.
      </p>

      {/* Receipt Paper - optimized for A5/A4 print */}
      <div 
        className="max-w-2xl mx-auto bg-white p-10 border border-slate-200 shadow-sm print:border-none print:shadow-none print:w-full print:max-w-full print:p-4 rounded-xl outline-none"
        contentEditable={true}
        suppressContentEditableWarning={true}
      >
        
        {/* Header */}
        <div className="text-center mb-8 border-b border-slate-200 pb-8">
          <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">{data.gymName}</h1>
          <p className="text-sm text-slate-500 print:text-slate-700">{data.branchName}</p>
          {data.branchAddress && <p className="text-sm text-slate-500 print:text-slate-700">{data.branchAddress}</p>}
          {data.branchPhone && <p className="text-sm text-slate-500 print:text-slate-700">Ph: {data.branchPhone}</p>}
          {data.gstEnabled && data.gstNumber && <p className="text-sm font-semibold mt-2">GSTIN: {data.gstNumber}</p>}
        </div>

        {/* Details Grid */}
        <div className="flex justify-between items-end mb-8">
           <div>
             <h3 className="text-xs font-bold text-slate-400 print:text-slate-500 uppercase tracking-wider mb-1">Billed To</h3>
             <p className="font-semibold text-lg">{data.memberName}</p>
             <p className="text-slate-600 print:text-slate-800">{data.memberPhone}</p>
           </div>
           <div className="text-right">
             <h3 className="text-xs font-bold text-slate-400 print:text-slate-500 uppercase tracking-wider mb-1">Receipt Details</h3>
             <p className="font-medium">No: <span className="font-mono">{data.receiptNo}</span></p>
             <p className="text-slate-600 print:text-slate-800">Date: {data.date}</p>
             <p className="text-slate-600 print:text-slate-800">Method: {data.paymentMethod}</p>
           </div>
        </div>

        {/* Line Items */}
        <table className="w-full text-left border-collapse mb-8">
           <thead>
             <tr className="border-b-2 border-slate-900 text-sm">
               <th className="py-3 font-semibold">Description</th>
               {data.gstEnabled && <th className="py-3 font-semibold text-right text-slate-500 print:text-slate-700 text-xs">SAC</th>}
               <th className="py-3 font-semibold text-right">Amount</th>
             </tr>
           </thead>
           <tbody>
             <tr className="border-b border-slate-200">
               <td className="py-4">
                 <p className="font-medium">{data.paymentType}</p>
                 {data.note && <p className="text-xs text-slate-500 mt-1">{data.note}</p>}
               </td>
               {data.gstEnabled && <td className="py-4 text-right text-sm text-slate-500 font-mono">{data.sacCode}</td>}
               <td className="py-4 text-right">{data.taxableAmountFormatted}</td>
             </tr>
             {data.gstEnabled && (
               <>
                 <tr className="border-b border-slate-100 text-sm text-slate-600 print:text-slate-800">
                   <td className="py-2" colSpan={2}>CGST ({(data.gstRate/2).toFixed(1)}%)</td>
                   <td className="py-2 text-right">{data.cgstAmountFormatted}</td>
                 </tr>
                 <tr className="border-b border-slate-200 text-sm text-slate-600 print:text-slate-800">
                   <td className="py-2" colSpan={2}>SGST ({(data.gstRate/2).toFixed(1)}%)</td>
                   <td className="py-2 text-right">{data.sgstAmountFormatted}</td>
                 </tr>
               </>
             )}
           </tbody>
           <tfoot>
             <tr className="text-lg font-bold">
               <td className="py-4 text-right pr-4" colSpan={data.gstEnabled ? 2 : 1}>Total Paid</td>
               <td className="py-4 text-right">{data.amountFormatted}</td>
             </tr>
           </tfoot>
        </table>

        {/* Footer */}
        <div className="text-center pt-8 text-sm text-slate-500 print:text-slate-700 border-t border-slate-200 flex flex-col items-center">
           <p className="font-medium mb-1">Thank you for your business!</p>
           <p className="text-xs">This is a computer-generated receipt and requires no physical signature.</p>
           <p className="text-xs font-mono mt-4 text-slate-300 print:text-slate-400">Ver: {authCode}</p>
        </div>

      </div>
    </div>
  );
}`;

code = code.replace(/export function ReceiptClient\(\{ data \}: \{ data: any \}\) \{[\s\S]*?\}\n/m, newComponent + '\n');
fs.writeFileSync('app/receipts/[paymentId]/receipt-client.tsx', code);
