"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function ReceiptClient({ data }: { data: any }) {
  const authCode = data.receiptNo.split('').map((c: string) => c.charCodeAt(0).toString(16)).join('').slice(0, 6).toUpperCase();

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 10mm; }
          body, .min-h-screen, .print-container { 
            background: white !important; 
            color: black !important;
          }
          /* Strip out Tailwind height rules for printing */
          html, body, #__next, .min-h-screen {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />

      <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans text-slate-900 print:bg-white print:p-0">
        
        {/* Controls */}
        <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center no-print">
          <Link href={`/members/${data.memberId}`} className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
        </div>

        {/* Receipt Paper */}
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 border border-slate-200 shadow-sm rounded-xl print-container text-slate-900 print:border-none print:shadow-none print:rounded-none">
          
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">{data.gymName}</h1>
            <p className="text-sm text-slate-500">{data.branchName}</p>
            {data.branchAddress && <p className="text-sm text-slate-500">{data.branchAddress}</p>}
            {data.branchPhone && <p className="text-sm text-slate-500">Ph: {data.branchPhone}</p>}
            {data.gstEnabled && data.gstNumber && <p className="text-sm font-semibold mt-2">GSTIN: {data.gstNumber}</p>}
          </div>

          {/* Details Grid */}
          <div className="flex justify-between items-start mb-8">
             <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</h3>
               <p className="font-semibold text-lg">{data.memberName}</p>
               <p className="text-slate-600">{data.memberPhone}</p>
             </div>
             <div className="text-right">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Receipt Details</h3>
               <p className="font-medium">No: <span className="font-mono">{data.receiptNo}</span></p>
               <p className="text-slate-600">Date: {data.date}</p>
               <p className="text-slate-600">Method: {data.paymentMethod}</p>
             </div>
          </div>

          {/* Line Items */}
          <table className="w-full text-left border-collapse mb-8">
             <thead>
               <tr className="border-b-2 border-slate-900 text-sm">
                 <th className="py-3 font-semibold">Description</th>
                 {data.gstEnabled && <th className="py-3 font-semibold text-right text-slate-500 text-xs">SAC</th>}
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
                   <tr className="border-b border-slate-100 text-sm text-slate-600">
                     <td className="py-2" colSpan={2}>CGST ({(data.gstRate/2).toFixed(1)}%)</td>
                     <td className="py-2 text-right">{data.cgstAmountFormatted}</td>
                   </tr>
                   <tr className="border-b border-slate-200 text-sm text-slate-600">
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
          <div className="text-center pt-8 text-sm text-slate-500 border-t border-slate-200">
             <p className="font-medium mb-1 text-slate-700">Thank you for your business!</p>
             <p className="text-xs">This is a computer-generated receipt and requires no physical signature.</p>
             <p className="text-xs font-mono mt-4 text-slate-400">Ver: {authCode}</p>
          </div>

        </div>
      </div>
    </>
  );
}
