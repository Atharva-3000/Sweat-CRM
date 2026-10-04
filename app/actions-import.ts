"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { addDays, today } from "@/lib/dates";
import { supabase } from "@/lib/supabase";

async function guarded(fn: () => Promise<any>): Promise<any> {
  await requireAdmin();
  try {
    return await fn();
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export type ParsedRow = {
  id: string;
  original: any;
  parsed: {
    name: string;
    phone: string;
    email: string;
    planId: string;
    planNameStr: string;
    startDate: string;
    endDate: string;
    balanceDue: number;
    notes: string;
  };
  errors: string[];
};

function parseDateStr(str: string): string {
  if (!str) return "";
  const s = str.trim();
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  
  // Try JS Date parsing
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  
  // Fallback for DD/MM/YY or DD-MM-YYYY
  const match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    let [_, d, m, y] = match;
    if (y.length === 2) y = "20" + y;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}

function cleanPhone(raw: string): string {
  if (!raw) return "";
  // extract just digits
  let digits = raw.replace(/\D/g, "");
  // remove 91 prefix if it's 12 digits
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  // remove 0 prefix if 11 digits
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  // Extract the first 10 digits found
  const match = digits.match(/\d{10}/);
  return match ? match[0] : digits;
}

export async function parseImportFile(csvText: string): Promise<{ ok: boolean, rows?: ParsedRow[], error?: string }> {
  return guarded(async () => {
    const { data: plans } = await supabase.from('plans').select('*');
    
    // Simple CSV parser (handles commas in quotes roughly)
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return { ok: false, error: "File is empty or missing data rows." };
    
    const header = lines[0].toLowerCase().split(",").map(h => h.trim());
    
    const parsedRows: ParsedRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      // Very naive split, works for the simple template
      const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const row: any = {};
      header.forEach((h, idx) => {
        row[h] = cols[idx] || "";
      });
      
      const errors: string[] = [];
      
      const name = row.name || row["member name"] || "";
      if (!name) errors.push("Missing name");
      
      const phone = cleanPhone(row.phone || row["mobile"] || "");
      if (phone.length !== 10) errors.push("Invalid phone length (requires 10 digits)");
      
      const email = row.email || "";
      
      const planNameStr = row.plan || row.membership || "";
      let planId = "";
      let planDurationDays = 30;
      if (planNameStr && plans) {
        const found = plans.find((p: any) => p.name.toLowerCase().includes(planNameStr.toLowerCase()));
        if (found) {
           planId = found.id;
           planDurationDays = found.durationDays;
        } else {
           errors.push(`Plan '${planNameStr}' not found in database. Needs manual mapping.`);
        }
      } else {
        errors.push("Missing plan");
      }
      
      let startDate = parseDateStr(row["start date"] || row.startdate || "");
      if (!startDate) startDate = today();
      
      let endDate = parseDateStr(row["end date"] || row.enddate || "");
      if (!endDate && startDate && planDurationDays) {
         endDate = addDays(startDate, planDurationDays);
      } else if (!endDate) {
         errors.push("Missing end date and could not infer from plan.");
      }
      
      let balanceDue = parseFloat(row["opening balance"] || row.balance || "0");
      if (isNaN(balanceDue)) balanceDue = 0;
      
      const notes = row.notes || row.note || "";
      
      parsedRows.push({
        id: `row-${i}`,
        original: row,
        parsed: { name, phone, email, planId, planNameStr, startDate, endDate, balanceDue, notes },
        errors
      });
    }
    
    return { ok: true, rows: parsedRows };
  });
}

export async function commitImport(validRows: ParsedRow["parsed"][]): Promise<{ ok: boolean, message?: string }> {
  return guarded(async () => {
    const [{ data: branches }, { data: staff }, { data: members }] = await Promise.all([
      supabase.from('branches').select('*').limit(1),
      supabase.from('staff').select('*').limit(1),
      supabase.from('members').select('id')
    ]);
    
    const branchId = branches?.[0]?.id || "B01";
    const trainerId = staff?.[0]?.id || "";
    
    let currentMax = 0;
    (members || []).forEach((m: any) => {
      const n = parseInt(m.id.replace("M", ""));
      if (!isNaN(n) && n > currentMax) currentMax = n;
    });
    
    const batchId = `import-${Date.now()}`;
    
    const newMembers = validRows.map(row => {
      currentMax++;
      const id = `M${String(currentMax).padStart(4, "0")}`;
      
      return {
        id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        gender: "Other", // Default, could be mapped if provided
        dob: "",
        address: "",
        branchId,
        planId: row.planId,
        trainerId,
        joinDate: today(),
        startDate: row.startDate,
        endDate: row.endDate,
        status: "active",
        frozenOn: "",
        balanceDue: row.balanceDue,
        emergencyContact: "",
        notes: row.notes + `\n[Imported in batch ${batchId}]`.trim(),
      };
    });
    
    if (newMembers.length > 0) {
      const { error } = await supabase.from('members').insert(newMembers);
      if (error) throw error;
    }
    
    revalidatePath("/members");
    revalidatePath("/dashboard");
    return { ok: true, message: `Successfully imported ${validRows.length} members.` };
  });
}
