"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_PASS, ADMIN_USER, BRANCH_COOKIE, SESSION_COOKIE, sessionToken } from "@/lib/session";
import { addDays, daysBetween, nowTime, today } from "@/lib/dates";
import { displayStatus, parseMemberRef, settingsOf } from "@/lib/queries";
import { TEMPLATES, type TemplateKey } from "@/lib/templates";
import type { ActionResult, Member } from "@/lib/types";
import { getActionEmailHtml } from "@/lib/email-templates";
import { supabase } from "@/lib/supabase";

// ---------- helpers ----------

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => {
  const n = parseFloat(str(fd, k));
  return Number.isFinite(n) ? n : 0;
};
const ok = (message?: string, redirectTo?: string): ActionResult => {
  revalidatePath("/", "layout");
  return { ok: true, message, redirectTo };
};
const fail = (error: string): ActionResult => ({ ok: false, error });

class UserError extends Error {}

async function guarded(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  await requireAdmin();
  try {
    return await fn();
  } catch (e) {
    if (e instanceof UserError) return fail(e.message);
    throw e;
  }
}

async function getNextId(table: string, prefix: string, pad = 4): Promise<string> {
  const { data } = await supabase.from(table).select('id');
  let max = 0;
  for (const row of data || []) {
    const numStr = row.id.replace(prefix, '');
    const n = parseInt(numStr, 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
}

export async function searchMembers(query: string) {
  await requireAdmin();
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  
  const { data: members } = await supabase.from('members').select('*');
  const s = await settingsOf();
  
  return (members || [])
    .filter((m: any) => m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.id.toLowerCase().includes(q))
    .map((m: any) => ({ id: m.id, name: m.name, phone: m.phone, status: displayStatus(m, s.reminderDays) }))
    .slice(0, 8);
}

async function findMember(id: string): Promise<Member> {
  const { data } = await supabase.from('members').select('*').eq('id', id).single();
  if (!data) throw new UserError("Member not found. Pick a member from the list.");
  return data as Member;
}

function validPhone(p: string) {
  return /^\d{10}$/.test(p.replace(/\D/g, "").slice(-10)) ? p.replace(/\D/g, "").slice(-10) : null;
}

// ---------- auth ----------

export async function login(_prev: { error?: string } | undefined, fd: FormData) {
  const username = str(fd, "username");
  const password = str(fd, "password");
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return { error: "Invalid username or password" };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/dashboard");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function setBranch(branchId: string) {
  await requireAdmin();
  const store = await cookies();
  store.set(BRANCH_COOKIE, branchId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

// ---------- members ----------

export async function createMember(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = str(fd, "name");
    const phone = validPhone(str(fd, "phone"));
    if (!name) throw new UserError("Name is required");
    if (!phone) throw new UserError("Enter a valid 10-digit phone number");
    const leadId = str(fd, "leadId");

    const { data: existing } = await supabase.from('members').select('id').eq('phone', phone);
    if (existing && existing.length > 0) throw new UserError("A member with this phone number already exists");

    const planId = str(fd, "planId");
    const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
    if (!plan) throw new UserError("Select a membership plan");

    const branchId = str(fd, "branchId");
    const { data: branch } = await supabase.from('branches').select('id').eq('id', branchId).single();
    if (!branch) throw new UserError("Select a branch");

    const startDate = str(fd, "startDate") || today();
    const paid = num(fd, "amountPaid");
    const discount = num(fd, "discount");
    const due = Math.max(0, plan.price - discount - paid);
    
    const id = await getNextId('members', 'M', 4);
    
    await supabase.from('members').insert({
      id,
      name,
      phone,
      email: str(fd, "email"),
      gender: str(fd, "gender"),
      dob: str(fd, "dob"),
      address: str(fd, "address"),
      branchId,
      planId: plan.id,
      trainerId: str(fd, "trainerId"),
      joinDate: today(),
      startDate,
      endDate: addDays(startDate, plan.durationDays - 1),
      status: "active",
      frozenOn: "",
      balanceDue: due,
      emergencyContact: str(fd, "emergencyContact"),
      notes: str(fd, "notes"),
    });

    if (paid > 0) {
      const pid = await getNextId('payments', 'P', 5);
      await supabase.from('payments').insert({
        id: pid,
        memberId: id,
        branchId,
        date: today(),
        amount: paid,
        method: str(fd, "method") || "Cash",
        type: "New",
        planId: plan.id,
        note: discount ? `Discount ₹${discount}` : "",
      });
    }

    if (leadId) {
      await supabase.from('leads').update({ status: "Converted", followUpDate: "" }).eq('id', leadId);
    }

    return ok(`Member ${name} added (${id})`, `/members/${id}`);
  });
}

export async function updateMember(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    const phone = validPhone(str(fd, "phone"));
    if (!str(fd, "name")) throw new UserError("Name is required");
    if (!phone) throw new UserError("Enter a valid 10-digit phone number");

    const m = await findMember(id);
    const { data: others } = await supabase.from('members').select('id').eq('phone', phone).neq('id', id);
    if (others && others.length > 0) throw new UserError("Another member already uses this phone number");

    await supabase.from('members').update({
      name: str(fd, "name"),
      phone,
      email: str(fd, "email"),
      gender: str(fd, "gender"),
      dob: str(fd, "dob"),
      address: str(fd, "address"),
      branchId: str(fd, "branchId") || m.branchId,
      trainerId: str(fd, "trainerId"),
      emergencyContact: str(fd, "emergencyContact"),
      notes: str(fd, "notes"),
      startDate: str(fd, "startDate") || m.startDate,
      endDate: str(fd, "endDate") || m.endDate,
      balanceDue: Math.max(0, num(fd, "balanceDue")),
    }).eq('id', id);

    return ok("Member updated", `/members/${id}`);
  });
}

export async function deleteMember(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await findMember(id); // Ensure exists
    await supabase.from('members').delete().eq('id', id);
    await supabase.from('bookings').delete().eq('memberId', id);
    return ok("Member deleted", "/members");
  });
}

export async function renewMembership(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    const m = await findMember(id);
    const planId = str(fd, "planId");
    
    const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
    if (!plan) throw new UserError("Select a plan");

    const startDate = str(fd, "startDate") || today();
    const paid = num(fd, "amountPaid");
    const discount = num(fd, "discount");
    const due = Math.max(0, plan.price - discount - paid);
    
    const endDate = addDays(startDate, plan.durationDays - 1);
    
    await supabase.from('members').update({
      planId: plan.id,
      startDate,
      endDate,
      status: "active",
      frozenOn: "",
      balanceDue: m.balanceDue + due,
    }).eq('id', id);

    if (paid > 0) {
      const pid = await getNextId('payments', 'P', 5);
      await supabase.from('payments').insert({
        id: pid,
        memberId: m.id,
        branchId: m.branchId,
        date: today(),
        amount: paid,
        method: str(fd, "method") || "Cash",
        type: "Renewal",
        planId: plan.id,
        note: [discount ? `Discount ₹${discount}` : "", str(fd, "note")].filter(Boolean).join(" · "),
      });
    }

    return ok(`Renewed ${m.name} till ${endDate}${due ? ` · ₹${due} added to dues` : ""}`);
  });
}

export async function recordPayment(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const memberId = parseMemberRef(fd.get("member") ?? fd.get("id"));
    const amount = num(fd, "amount");
    if (amount <= 0) throw new UserError("Enter an amount greater than 0");
    const type = str(fd, "type") || "Due Payment";
    
    const m = await findMember(memberId);
    if (type === "Due Payment") {
      await supabase.from('members').update({ balanceDue: Math.max(0, m.balanceDue - amount) }).eq('id', memberId);
    }
    
    const pid = await getNextId('payments', 'P', 5);
    await supabase.from('payments').insert({
      id: pid,
      memberId: m.id,
      branchId: m.branchId,
      date: str(fd, "date") || today(),
      amount,
      method: str(fd, "method") || "Cash",
      type,
      planId: m.planId,
      note: str(fd, "note"),
    });

    return ok(`₹${amount} received from ${m.name}`);
  });
}

export async function deletePayment(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await supabase.from('payments').delete().eq('id', id);
    return ok("Payment deleted");
  });
}

export async function freezeMember(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    const m = await findMember(id);
    await supabase.from('members').update({ status: "frozen", frozenOn: today() }).eq('id', id);
    return ok(`${m.name}'s membership is frozen. Days will be added back on unfreeze.`);
  });
}

export async function unfreezeMember(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    const m = await findMember(id);
    const days = m.frozenOn ? Math.max(0, daysBetween(m.frozenOn, today())) : 0;
    const endDate = addDays(m.endDate, days);
    await supabase.from('members').update({ endDate, status: "active", frozenOn: "" }).eq('id', id);
    return ok(`${m.name} unfrozen · ${days} day(s) added to membership`);
  });
}

export async function setMemberCancelled(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    const cancel = str(fd, "cancel") === "1";
    await findMember(id);
    await supabase.from('members').update({ status: cancel ? "cancelled" : "active", frozenOn: "" }).eq('id', id);
    return ok(cancel ? "Membership cancelled" : "Membership reactivated");
  });
}

// ---------- attendance ----------

export async function checkIn(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const memberId = parseMemberRef(fd.get("member") ?? fd.get("id"));
    const m = await findMember(memberId);
    const s = await settingsOf();
    const st = displayStatus(m, s.reminderDays);
    if (st === "expired") throw new UserError(`${m.name}'s membership expired on ${m.endDate}. Renew first.`);
    if (st === "frozen") throw new UserError(`${m.name}'s membership is frozen. Unfreeze first.`);
    if (st === "cancelled") throw new UserError(`${m.name}'s membership is cancelled.`);
    const T = today();
    
    const { data: existing } = await supabase.from('attendance').select('id').eq('memberId', m.id).eq('date', T);
    if (existing && existing.length > 0) {
      throw new UserError(`${m.name} has already checked in today`);
    }
    
    const aid = await getNextId('attendance', 'A', 6);
    await supabase.from('attendance').insert({
      id: aid,
      memberId: m.id,
      branchId: str(fd, "branchId") || m.branchId,
      date: T,
      time: nowTime(),
    });
    
    const left = daysBetween(T, m.endDate);
    return ok(`${m.name} checked in ✓ (${left} day${left === 1 ? "" : "s"} left${m.balanceDue ? ` · ₹${m.balanceDue} due` : ""})`);
  });
}

// ---------- plans ----------

export async function savePlan(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = str(fd, "name");
    const durationDays = num(fd, "durationDays");
    const price = num(fd, "price");
    if (!name || durationDays <= 0 || price < 0) throw new UserError("Name, duration and price are required");
    const id = str(fd, "id");
    const data = { name, durationDays, price, description: str(fd, "description"), features: "", active: fd.get("active") === "on" };
    
    if (id) {
      await supabase.from('plans').update(data).eq('id', id);
    } else {
      const pid = await getNextId('plans', 'PL', 2);
      await supabase.from('plans').insert({ id: pid, ...data });
    }
    return ok(id ? "Plan updated" : "Plan created");
  });
}
// ---------- staff ----------

export async function saveStaff(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name) throw new UserError("Name is required");
    const id = str(fd, "id");
    const data = {
      name,
      role: str(fd, "role"),
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      branchId: str(fd, "branchId"),
      salary: num(fd, "salary"),
      specialization: str(fd, "specialization"),
      active: fd.get("active") === "on",
    };
    if (id) {
      await supabase.from('staff').update(data).eq('id', id);
    } else {
      const sid = await getNextId('staff', 'S', 3);
      await supabase.from('staff').insert({ id: sid, joinDate: today(), ...data });
    }
    return ok(id ? "Staff updated" : "Staff added");
  });
}

export async function deleteStaff(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await supabase.from('staff').delete().eq('id', id);
    await supabase.from('members').update({ trainerId: "" }).eq('trainerId', id);
    return ok("Staff removed");
  });
}

// ---------- leads ----------

export async function saveLead(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name || !str(fd, "phone")) throw new UserError("Name and phone are required");
    const id = str(fd, "id");
    const data = {
      name,
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      branchId: str(fd, "branchId"),
      source: str(fd, "source"),
      interest: str(fd, "interest"),
      status: str(fd, "status") || "New",
      followUpDate: str(fd, "followUpDate"),
      notes: str(fd, "notes"),
    };
    if (id) {
      await supabase.from('leads').update(data).eq('id', id);
    } else {
      const lid = await getNextId('leads', 'L', 3);
      await supabase.from('leads').insert({ id: lid, createdAt: today(), ...data });
    }
    return ok(id ? "Enquiry updated" : "Enquiry added");
  });
}

export async function setLeadStatus(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const status = str(fd, "status");
    const id = str(fd, "id");
    const { data: l } = await supabase.from('leads').select('*').eq('id', id).single();
    if (!l) throw new UserError("Enquiry not found");
    const followUpDate = (status === "Converted" || status === "Lost") ? "" : l.followUpDate;
    await supabase.from('leads').update({ status, followUpDate }).eq('id', id);
    return ok(`Status changed to ${status}`);
  });
}

export async function deleteLead(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await supabase.from('leads').delete().eq('id', id);
    return ok("Enquiry deleted");
  });
}

// ---------- classes & bookings ----------

export async function saveClass(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name || !str(fd, "time")) throw new UserError("Class name and time are required");
    const id = str(fd, "id");
    const data = {
      name,
      branchId: str(fd, "branchId"),
      trainerId: str(fd, "trainerId"),
      day: str(fd, "day"),
      time: str(fd, "time"),
      durationMin: num(fd, "durationMin") || 60,
      capacity: num(fd, "capacity") || 15,
    };
    if (id) {
      await supabase.from('classes').update(data).eq('id', id);
    } else {
      const cid = await getNextId('classes', 'C', 3);
      await supabase.from('classes').insert({ id: cid, ...data });
    }
    return ok(id ? "Class updated" : "Class added to schedule");
  });
}

export async function deleteClass(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await supabase.from('classes').delete().eq('id', id);
    await supabase.from('bookings').delete().eq('classId', id);
    return ok("Class removed");
  });
}

export async function bookClass(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const memberId = parseMemberRef(fd.get("member"));
    const classId = str(fd, "classId");
    const date = str(fd, "date");
    
    const { data: c } = await supabase.from('classes').select('*').eq('id', classId).single();
    if (!c) throw new UserError("Class not found");
    
    const m = await findMember(memberId);
    const s = await settingsOf();
    const st = displayStatus(m, s.reminderDays);
    if (st === "expired" || st === "cancelled" || st === "frozen") throw new UserError(`${m.name}'s membership is ${st}`);
    
    const { data: existing } = await supabase.from('bookings').select('*').eq('classId', classId).eq('date', date);
    if ((existing || []).some((b: any) => b.memberId === m.id)) throw new UserError(`${m.name} is already booked`);
    if ((existing || []).length >= c.capacity) throw new UserError("Class is full");
    
    const bid = await getNextId('bookings', 'B', 5);
    await supabase.from('bookings').insert({ id: bid, classId, memberId: m.id, date, status: "booked" });
    return ok(`${m.name} booked`);
  });
}

export async function cancelBooking(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await supabase.from('bookings').delete().eq('id', id);
    return ok("Booking cancelled");
  });
}

export async function toggleBookingAttended(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    const { data: b } = await supabase.from('bookings').select('status').eq('id', id).single();
    if (b) {
      await supabase.from('bookings').update({ status: b.status === "attended" ? "booked" : "attended" }).eq('id', id);
    }
    return ok();
  });
}

// ---------- expenses ----------

export async function addExpense(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const amount = num(fd, "amount");
    if (amount <= 0) throw new UserError("Enter an amount");
    const eid = await getNextId('expenses', 'E', 4);
    await supabase.from('expenses').insert({
      id: eid,
      branchId: str(fd, "branchId"),
      date: str(fd, "date") || today(),
      category: str(fd, "category") || "Other",
      amount,
      note: str(fd, "note"),
    });
    return ok("Expense added");
  });
}

export async function deleteExpense(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await supabase.from('expenses').delete().eq('id', id);
    return ok("Expense deleted");
  });
}
// ---------- messaging (mock) ----------

export async function logMessage(input: {
  channel: string;
  to: string;
  recipientName: string;
  refType: string;
  refId: string;
  subject: string;
  body: string;
}): Promise<ActionResult> {
  return guarded(async () => {
    const mid = await getNextId('messages', 'MSG', 5);
    await supabase.from('messages').insert({
      id: mid,
      ...input,
      sentAt: `${today()} ${nowTime()}`,
      status: input.channel === "call" ? "Call logged (mock)" : "Sent (mock)",
    });
    const labelMap: Record<string, string> = { whatsapp: "WhatsApp message", sms: "SMS", email: "Email", call: "Call" };
    const label = labelMap[String(input.channel)] ?? "Message";
    return ok(input.channel === "call" ? `Call to ${input.recipientName} logged (mock)` : `${label} sent to ${input.recipientName} (mock)`);
  });
}

export async function sendBulkReminder(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ids = str(fd, "memberIds").split(",").filter(Boolean);
    const template = (str(fd, "template") || "expiry") as TemplateKey;
    const channel = str(fd, "channel") || "whatsapp";
    if (!ids.length) throw new UserError("No members selected");
    
    const s = await settingsOf();
    const { data: plansData } = await supabase.from('plans').select('*');
    const plans = new Map((plansData || []).map((p: any) => [p.id, p.name]));
    
    let n = 0;
    for (const id of ids) {
      const m = await findMember(id).catch(() => null);
      if (!m) continue;
      const ctx = { name: m.name, gymName: s.gymName, planName: plans.get(m.planId), endDate: m.endDate, due: m.balanceDue };
      const mid = await getNextId('messages', 'MSG', 5);
      await supabase.from('messages').insert({
        id: mid,
        channel,
        recipientName: m.name,
        to: channel === "email" ? m.email : m.phone,
        refType: "member",
        refId: m.id,
        subject: TEMPLATES[template].subject(ctx as any),
        body: TEMPLATES[template].body(ctx as any),
        sentAt: `${today()} ${nowTime()}`,
        status: "Sent (mock)",
      });
      n++;
    }
    return ok(`${n} ${channel === "email" ? "emails" : "WhatsApp reminders"} sent (mock)`);
  });
}

// ---------- settings ----------

export async function saveSettings(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const keys = ["gymName", "ownerName", "reminderDays", "countryCode", "dbProvider", "googleSheetId", "senderEmail", "gstNumber", "gstRate", "sacCode"];
    for (const key of keys) {
      const value = str(fd, key);
      const { data } = await supabase.from('settings').select('key').eq('key', key).single();
      if (data) await supabase.from('settings').update({ value }).eq('key', key);
      else await supabase.from('settings').insert({ key, value });
    }
    
    const gstEnabled = fd.get("gstEnabled") === "on" ? "true" : "false";
    const { data } = await supabase.from('settings').select('key').eq('key', "gstEnabled").single();
    if (data) await supabase.from('settings').update({ value: gstEnabled }).eq('key', "gstEnabled");
    else await supabase.from('settings').insert({ key: "gstEnabled", value: gstEnabled });
    
    return ok("Settings saved");
  });
}

export async function saveBranch(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    const { data: b } = await supabase.from('branches').select('id').eq('id', id).single();
    if (!b) throw new UserError("Branch not found");
    await supabase.from('branches').update({ name: str(fd, "name"), address: str(fd, "address"), phone: str(fd, "phone"), manager: str(fd, "manager") }).eq('id', id);
    return ok("Branch updated");
  });
}

export async function resetDemoData(): Promise<ActionResult> {
  return guarded(async () => {
    // Demo data functionality not fully reimplemented with supabase here
    return ok("Demo data functionality not available in Supabase mode");
  });
}

export async function completeOnboarding(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const keys = ["gymName", "ownerName", "countryCode", "gstNumber", "gstRate"];
    for (const key of keys) {
      const value = str(fd, key);
      if (value) {
        const { data } = await supabase.from('settings').select('key').eq('key', key).single();
        if (data) await supabase.from('settings').update({ value }).eq('key', key);
        else await supabase.from('settings').insert({ key, value });
      }
    }
    const { data } = await supabase.from('settings').select('key').eq('key', 'onboardingComplete').single();
    if (data) await supabase.from('settings').update({ value: "true" }).eq('key', 'onboardingComplete');
    else await supabase.from('settings').insert({ key: 'onboardingComplete', value: "true" });
    
    return ok("Welcome aboard!");
  });
}

export async function sendVerificationOTP(email: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    let senderEmail = "onboarding@cloverstudio.art";
    let gymName = "Sweat CRM";

    const { data: rRow } = await supabase.from('settings').select('key').eq('key', 'temp_otp').single();
    if (rRow) await supabase.from('settings').update({ value: otp }).eq('key', 'temp_otp');
    else await supabase.from('settings').insert({ key: 'temp_otp', value: otp });
    
    const { data: eRow } = await supabase.from('settings').select('key').eq('key', 'temp_email').single();
    if (eRow) await supabase.from('settings').update({ value: email }).eq('key', 'temp_email');
    else await supabase.from('settings').insert({ key: 'temp_email', value: email });
    
    const { data: sRow } = await supabase.from('settings').select('value').eq('key', 'senderEmail').single();
    if (sRow && sRow.value) senderEmail = sRow.value;
    if (senderEmail.includes("@gmail.com") || senderEmail.includes("@yahoo.com")) {
      senderEmail = "onboarding@cloverstudio.art";
    }
    const { data: gRow } = await supabase.from('settings').select('value').eq('key', 'gymName').single();
    if (gRow && gRow.value) gymName = gRow.value;

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { error } = await resend.emails.send({
        from: `${gymName} <${senderEmail}>`,
        to: [email],
        subject: 'Your Verification Code',
        html: getActionEmailHtml(gymName, "Verify Your Email", "Please use the following 6-digit code to verify your sender email address.", otp)
      });
      
      if (error) {
        return { ok: false, error: error.message };
      }
    } else {
      console.log(`[MOCK EMAIL] To: ${email}, Subject: OTP, Body: ${otp}`);
      return { ok: true, message: "Mock OTP sent (check console)", error: otp }; 
    }
    
    return { ok: true, message: "OTP sent successfully" };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function verifyOTP(code: string): Promise<{ ok: boolean; error?: string }> {
  const { data } = await supabase.from('settings').select('value').eq('key', 'temp_otp').single();
  if (data && data.value === code) {
    return { ok: true };
  }
  return { ok: false, error: "Invalid OTP code" };
}

export async function sendTestEmail(fd: FormData): Promise<ActionResult> {
  const emailTo = str(fd, "testEmail");
  if (!emailTo) return { ok: false, error: "Email is required" };

  try {
    let senderEmail = "onboarding@cloverstudio.art";
    let gymName = "Sweat CRM";

    const { data: sRow } = await supabase.from('settings').select('value').eq('key', 'senderEmail').single();
    if (sRow && sRow.value) senderEmail = sRow.value;
    if (senderEmail.includes("@gmail.com") || senderEmail.includes("@yahoo.com")) {
      senderEmail = "onboarding@cloverstudio.art";
    }
    const { data: gRow } = await supabase.from('settings').select('value').eq('key', 'gymName').single();
    if (gRow && gRow.value) gymName = gRow.value;

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { error } = await resend.emails.send({
        from: `${gymName} <${senderEmail}>`,
        to: [emailTo],
        subject: 'Test Email from Sweat CRM',
        html: getActionEmailHtml(gymName, "Test Email Successful", "Success! Your custom domain is fully verified and your email functionality is working perfectly.")
      });
      
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true, message: "Test email sent successfully!" };
    } else {
      return { ok: false, error: "RESEND_API_KEY is not configured in .env.local" };
    }
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function verifyAndSaveLoginEmail(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const { data: rRow } = await supabase.from('settings').select('value').eq('key', 'temp_otp').single();
  if (rRow && rRow.value === code) {
    const { data: loginRow } = await supabase.from('settings').select('key').eq('key', 'ownerLoginEmail').single();
    if (loginRow) await supabase.from('settings').update({ value: email }).eq('key', 'ownerLoginEmail');
    else await supabase.from('settings').insert({ key: 'ownerLoginEmail', value: email });
    return { ok: true };
  }
  return { ok: false, error: "Invalid OTP code" };
}

export async function requestLoginOTP(email: string): Promise<{ ok: boolean; error?: string }> {
  let isAuthorized = false;
  let gymName = "Sweat CRM";
  let senderEmail = "onboarding@cloverstudio.art";

  const { data: sRow } = await supabase.from('settings').select('value').eq('key', 'senderEmail').single();
  if (sRow && sRow.value) senderEmail = sRow.value;
  if (senderEmail.includes("@gmail.com") || senderEmail.includes("@yahoo.com")) {
    senderEmail = "onboarding@cloverstudio.art";
  }
  const { data: gRow } = await supabase.from('settings').select('value').eq('key', 'gymName').single();
  if (gRow && gRow.value) gymName = gRow.value;
  
  const { data: ownerEmailRow } = await supabase.from('settings').select('value').eq('key', 'ownerLoginEmail').single();
  const authorizedEmail = ownerEmailRow?.value || "atharvadeshmukh.dev@gmail.com";
  if (authorizedEmail === email) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return { ok: false, error: "This email is not registered as the Owner Login Email." };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const { data: otpRow } = await supabase.from('settings').select('key').eq('key', 'temp_login_otp').single();
  if (otpRow) await supabase.from('settings').update({ value: otp }).eq('key', 'temp_login_otp');
  else await supabase.from('settings').insert({ key: 'temp_login_otp', value: otp });

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { error } = await resend.emails.send({
        from: `${gymName} <${senderEmail}>`,
        to: [email],
        subject: 'Your Secure Login Code',
        html: getActionEmailHtml(gymName, "Secure Login", "Use the following 6-digit code to securely log in to your dashboard.", otp)
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  } else {
    return { ok: true, error: otp };
  }
}

export async function loginWithOTP(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const { data: emailRow } = await supabase.from('settings').select('value').eq('key', 'ownerLoginEmail').single();
  const authorizedEmail = emailRow?.value || "atharvadeshmukh.dev@gmail.com";
  const { data: otpRow } = await supabase.from('settings').select('value').eq('key', 'temp_login_otp').single();
  
  if (authorizedEmail === email && otpRow && otpRow.value === code) {
    await supabase.from('settings').update({ value: "" }).eq('key', 'temp_login_otp');
    const store = await cookies();
    store.set(SESSION_COOKIE, sessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/dashboard");
  }

  return { ok: false, error: "Invalid or expired login code." };
}

export async function logCallOutcome(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const memberId = str(fd, "memberId");
    const outcome = str(fd, "outcome");
    const notes = str(fd, "notes");
    
    let followUpDays = 0;
    if (outcome === "will_pay") followUpDays = 3;
    else if (outcome === "no_answer") followUpDays = 1;
    else if (outcome === "freeze") followUpDays = 0;
    else if (outcome === "cancel") followUpDays = 0;
    else followUpDays = 7; 

    const followUpDateStr = followUpDays > 0 ? addDays(today(), followUpDays) : "";

    const staffId = "admin";
    const cid = await getNextId('callLogs', 'C', 5);
    
    await supabase.from('callLogs').insert({
      id: cid,
      memberId,
      staffId,
      outcome,
      notes,
      followUpDate: followUpDateStr,
      createdAt: new Date().toISOString(),
    });
    
    if (followUpDateStr) {
      await supabase.from('members').update({ followUpDate: followUpDateStr }).eq('id', memberId);
    }

    revalidatePath("/members");
    revalidatePath(`/members/${memberId}`);
    return { ok: true, message: "Call outcome logged" };
  });
}
