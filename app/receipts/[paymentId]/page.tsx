import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { settingsOf } from "@/lib/queries";
import { notFound } from "next/navigation";
import { formatINR } from "@/lib/dates";
import { ReceiptClient } from "./receipt-client";

export async function generateMetadata({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const { data: payment } = await supabase.from('payments').select('*').eq('id', paymentId).single();
  if (!payment) return { title: "Receipt" };
  
  const { data: member } = await supabase.from('members').select('*').eq('id', payment.memberId).single();
  const nameStr = member ? member.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : "member";
  
  // parse YYYY-MM-DD
  let d = new Date(payment.date);
  if (isNaN(d.getTime())) d = new Date(); // fallback
  
  const month = d.toLocaleString('default', { month: 'short' }).toLowerCase();
  const year = d.getFullYear();
  
  return {
    title: `${nameStr}-${month}-${year}`
  };
}

export default async function ReceiptPage({ params }: { params: Promise<{ paymentId: string }> }) {
  await requireAdmin();
  const { paymentId } = await params;
  
  const { data: payment } = await supabase.from('payments').select('*').eq('id', paymentId).single();
  if (!payment) notFound();
  
  const { data: member } = await supabase.from('members').select('*').eq('id', payment.memberId).single();
  if (!member) notFound();
  
  const s = await settingsOf();
  const { data: branch } = await supabase.from('branches').select('*').eq('id', payment.branchId).maybeSingle();

  // If GST is enabled, calculate the split
  let taxableAmount = payment.amount;
  let gstAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  
  if (s.gstEnabled && (s.gstRate || 0) > 0) {
    const rateDecimal = (s.gstRate || 18) / 100;
    taxableAmount = payment.amount / (1 + rateDecimal);
    gstAmount = payment.amount - taxableAmount;
    // Split into CGST and SGST
    cgstAmount = gstAmount / 2;
    sgstAmount = gstAmount / 2;
  }
  
  const receiptData = {
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
  };

  return <ReceiptClient data={receiptData} />;
}
