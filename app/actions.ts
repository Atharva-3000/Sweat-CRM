"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb, mutate, nextId, resetDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_PASS, ADMIN_USER, BRANCH_COOKIE, SESSION_COOKIE, sessionToken } from "@/lib/session";
import { addDays, daysBetween, nowTime, today } from "@/lib/dates";
import { displayStatus, parseMemberRef, settingsOf } from "@/lib/queries";
import { TEMPLATES, type TemplateKey } from "@/lib/templates";
import type { ActionResult, Db, Member } from "@/lib/types";
import { getActionEmailHtml } from "@/lib/email-templates";

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

/** Wrap an action so validation errors become friendly toasts. */
async function guarded(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  await requireAdmin();
  try {
    return await fn();
  } catch (e) {
    if (e instanceof UserError) return fail(e.message);
    throw e;
  }
}

export async function searchMembers(query: string) {
  await requireAdmin();
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  const db = await getDb();
  return db.members
    .filter(m => m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.id.toLowerCase().includes(q))
    .map(m => ({ id: m.id, name: m.name, phone: m.phone, status: displayStatus(m, settingsOf(db).reminderDays) }))
    .slice(0, 8);
}

function findMember(db: Db, id: string): Member {
  const m = db.members.find((x) => x.id === id);
  if (!m) throw new UserError("Member not found. Pick a member from the list.");
  return m;
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

    const id = await mutate((db) => {
      if (db.members.some((m) => m.phone === phone)) throw new UserError("A member with this phone number already exists");
      const plan = db.plans.find((p) => p.id === str(fd, "planId"));
      if (!plan) throw new UserError("Select a membership plan");
      const branchId = str(fd, "branchId");
      if (!db.branches.some((b) => b.id === branchId)) throw new UserError("Select a branch");
      const startDate = str(fd, "startDate") || today();
      const paid = num(fd, "amountPaid");
      const discount = num(fd, "discount");
      const due = Math.max(0, plan.price - discount - paid);
      const id = nextId(db.members, "M");
      db.members.push({
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
        db.payments.push({
          id: nextId(db.payments, "P", 5),
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
        const lead = db.leads.find((l) => l.id === leadId);
        if (lead) {
          lead.status = "Converted";
          lead.followUpDate = "";
        }
      }
      return id;
    });
    return ok(`Member ${name} added (${id})`, `/members/${id}`);
  });
}

export async function updateMember(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    const phone = validPhone(str(fd, "phone"));
    if (!str(fd, "name")) throw new UserError("Name is required");
    if (!phone) throw new UserError("Enter a valid 10-digit phone number");
    await mutate((db) => {
      const m = findMember(db, id);
      if (db.members.some((x) => x.phone === phone && x.id !== id)) throw new UserError("Another member already uses this phone number");
      Object.assign(m, {
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
      });
    });
    return ok("Member updated", `/members/${id}`);
  });
}

export async function deleteMember(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await mutate((db) => {
      findMember(db, id);
      db.members = db.members.filter((m) => m.id !== id);
      db.bookings = db.bookings.filter((b) => b.memberId !== id);
    });
    return ok("Member deleted", "/members");
  });
}

export async function renewMembership(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    const result = await mutate((db) => {
      const m = findMember(db, id);
      const plan = db.plans.find((p) => p.id === str(fd, "planId"));
      if (!plan) throw new UserError("Select a plan");
      const startDate = str(fd, "startDate") || today();
      const paid = num(fd, "amountPaid");
      const discount = num(fd, "discount");
      const due = Math.max(0, plan.price - discount - paid);
      m.planId = plan.id;
      m.startDate = startDate;
      m.endDate = addDays(startDate, plan.durationDays - 1);
      m.status = "active";
      m.frozenOn = "";
      m.balanceDue = m.balanceDue + due;
      if (paid > 0) {
        db.payments.push({
          id: nextId(db.payments, "P", 5),
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
      return { name: m.name, endDate: m.endDate, due };
    });
    return ok(`Renewed ${result.name} till ${result.endDate}${result.due ? ` · ₹${result.due} added to dues` : ""}`);
  });
}

export async function recordPayment(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const memberId = parseMemberRef(fd.get("member") ?? fd.get("id"));
    const amount = num(fd, "amount");
    if (amount <= 0) throw new UserError("Enter an amount greater than 0");
    const type = str(fd, "type") || "Due Payment";
    const name = await mutate((db) => {
      const m = findMember(db, memberId);
      if (type === "Due Payment") m.balanceDue = Math.max(0, m.balanceDue - amount);
      db.payments.push({
        id: nextId(db.payments, "P", 5),
        memberId: m.id,
        branchId: m.branchId,
        date: str(fd, "date") || today(),
        amount,
        method: str(fd, "method") || "Cash",
        type,
        planId: m.planId,
        note: str(fd, "note"),
      });
      return m.name;
    });
    return ok(`₹${amount} received from ${name}`);
  });
}

export async function deletePayment(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await mutate((db) => {
      db.payments = db.payments.filter((p) => p.id !== id);
    });
    return ok("Payment deleted");
  });
}

export async function freezeMember(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = await mutate((db) => {
      const m = findMember(db, str(fd, "id"));
      m.status = "frozen";
      m.frozenOn = today();
      return m.name;
    });
    return ok(`${name}'s membership is frozen. Days will be added back on unfreeze.`);
  });
}

export async function unfreezeMember(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const res = await mutate((db) => {
      const m = findMember(db, str(fd, "id"));
      const days = m.frozenOn ? Math.max(0, daysBetween(m.frozenOn, today())) : 0;
      m.endDate = addDays(m.endDate, days);
      m.status = "active";
      m.frozenOn = "";
      return { name: m.name, days };
    });
    return ok(`${res.name} unfrozen · ${res.days} day(s) added to membership`);
  });
}

export async function setMemberCancelled(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const cancel = str(fd, "cancel") === "1";
    await mutate((db) => {
      const m = findMember(db, str(fd, "id"));
      m.status = cancel ? "cancelled" : "active";
      m.frozenOn = "";
    });
    return ok(cancel ? "Membership cancelled" : "Membership reactivated");
  });
}

// ---------- attendance ----------

export async function checkIn(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const memberId = parseMemberRef(fd.get("member") ?? fd.get("id"));
    const msg = await mutate((db) => {
      const m = findMember(db, memberId);
      const s = settingsOf(db);
      const st = displayStatus(m, s.reminderDays);
      if (st === "expired") throw new UserError(`${m.name}'s membership expired on ${m.endDate}. Renew first.`);
      if (st === "frozen") throw new UserError(`${m.name}'s membership is frozen. Unfreeze first.`);
      if (st === "cancelled") throw new UserError(`${m.name}'s membership is cancelled.`);
      const T = today();
      if (db.attendance.some((a) => a.memberId === m.id && a.date === T)) {
        throw new UserError(`${m.name} has already checked in today`);
      }
      db.attendance.push({
        id: nextId(db.attendance, "A", 6),
        memberId: m.id,
        branchId: str(fd, "branchId") || m.branchId,
        date: T,
        time: nowTime(),
      });
      const left = daysBetween(T, m.endDate);
      return `${m.name} checked in ✓ (${left} day${left === 1 ? "" : "s"} left${m.balanceDue ? ` · ₹${m.balanceDue} due` : ""})`;
    });
    return ok(msg);
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
    await mutate((db) => {
      const data = { name, durationDays, price, description: str(fd, "description"), features: "", active: fd.get("active") === "on" };
      if (id) Object.assign(db.plans.find((p) => p.id === id) ?? {}, data);
      else db.plans.push({ id: nextId(db.plans, "PL", 2), ...data });
    });
    return ok(id ? "Plan updated" : "Plan created");
  });
}

// ---------- staff ----------

export async function saveStaff(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name) throw new UserError("Name is required");
    const id = str(fd, "id");
    await mutate((db) => {
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
      if (id) Object.assign(db.staff.find((s) => s.id === id) ?? {}, data);
      else db.staff.push({ id: nextId(db.staff, "S", 3), joinDate: today(), ...data });
    });
    return ok(id ? "Staff updated" : "Staff added");
  });
}

export async function deleteStaff(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await mutate((db) => {
      db.staff = db.staff.filter((s) => s.id !== id);
      db.members.forEach((m) => m.trainerId === id && (m.trainerId = ""));
    });
    return ok("Staff removed");
  });
}

// ---------- leads ----------

export async function saveLead(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name || !str(fd, "phone")) throw new UserError("Name and phone are required");
    const id = str(fd, "id");
    await mutate((db) => {
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
      if (id) Object.assign(db.leads.find((l) => l.id === id) ?? {}, data);
      else db.leads.push({ id: nextId(db.leads, "L", 3), createdAt: today(), ...data });
    });
    return ok(id ? "Enquiry updated" : "Enquiry added");
  });
}

export async function setLeadStatus(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const status = str(fd, "status");
    await mutate((db) => {
      const l = db.leads.find((x) => x.id === str(fd, "id"));
      if (!l) throw new UserError("Enquiry not found");
      l.status = status;
      if (status === "Converted" || status === "Lost") l.followUpDate = "";
    });
    return ok(`Status changed to ${status}`);
  });
}

export async function deleteLead(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await mutate((db) => {
      db.leads = db.leads.filter((l) => l.id !== id);
    });
    return ok("Enquiry deleted");
  });
}

// ---------- classes & bookings ----------

export async function saveClass(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name || !str(fd, "time")) throw new UserError("Class name and time are required");
    const id = str(fd, "id");
    await mutate((db) => {
      const data = {
        name,
        branchId: str(fd, "branchId"),
        trainerId: str(fd, "trainerId"),
        day: str(fd, "day"),
        time: str(fd, "time"),
        durationMin: num(fd, "durationMin") || 60,
        capacity: num(fd, "capacity") || 15,
      };
      if (id) Object.assign(db.classes.find((c) => c.id === id) ?? {}, data);
      else db.classes.push({ id: nextId(db.classes, "C", 3), ...data });
    });
    return ok(id ? "Class updated" : "Class added to schedule");
  });
}

export async function deleteClass(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await mutate((db) => {
      db.classes = db.classes.filter((c) => c.id !== id);
      db.bookings = db.bookings.filter((b) => b.classId !== id);
    });
    return ok("Class removed");
  });
}

export async function bookClass(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const memberId = parseMemberRef(fd.get("member"));
    const classId = str(fd, "classId");
    const date = str(fd, "date");
    const name = await mutate((db) => {
      const c = db.classes.find((x) => x.id === classId);
      if (!c) throw new UserError("Class not found");
      const m = findMember(db, memberId);
      const st = displayStatus(m, settingsOf(db).reminderDays);
      if (st === "expired" || st === "cancelled" || st === "frozen") throw new UserError(`${m.name}'s membership is ${st}`);
      const existing = db.bookings.filter((b) => b.classId === classId && b.date === date);
      if (existing.some((b) => b.memberId === m.id)) throw new UserError(`${m.name} is already booked`);
      if (existing.length >= c.capacity) throw new UserError("Class is full");
      db.bookings.push({ id: nextId(db.bookings, "B", 5), classId, memberId: m.id, date, status: "booked" });
      return m.name;
    });
    return ok(`${name} booked`);
  });
}

export async function cancelBooking(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await mutate((db) => {
      db.bookings = db.bookings.filter((b) => b.id !== id);
    });
    return ok("Booking cancelled");
  });
}

export async function toggleBookingAttended(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    await mutate((db) => {
      const b = db.bookings.find((x) => x.id === str(fd, "id"));
      if (b) b.status = b.status === "attended" ? "booked" : "attended";
    });
    return ok();
  });
}

// ---------- expenses ----------

export async function addExpense(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const amount = num(fd, "amount");
    if (amount <= 0) throw new UserError("Enter an amount");
    await mutate((db) => {
      db.expenses.push({
        id: nextId(db.expenses, "E", 4),
        branchId: str(fd, "branchId"),
        date: str(fd, "date") || today(),
        category: str(fd, "category") || "Other",
        amount,
        note: str(fd, "note"),
      });
    });
    return ok("Expense added");
  });
}

export async function deleteExpense(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const id = str(fd, "id");
    await mutate((db) => {
      db.expenses = db.expenses.filter((e) => e.id !== id);
    });
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
    await mutate((db) => {
      db.messages.push({
        id: nextId(db.messages, "MSG", 5),
        ...input,
        sentAt: `${today()} ${nowTime()}`,
        status: input.channel === "call" ? "Call logged (mock)" : "Sent (mock)",
      });
    });
    const label = { whatsapp: "WhatsApp message", sms: "SMS", email: "Email", call: "Call" }[input.channel] ?? "Message";
    return ok(input.channel === "call" ? `Call to ${input.recipientName} logged (mock)` : `${label} sent to ${input.recipientName} (mock)`);
  });
}

export async function sendBulkReminder(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ids = str(fd, "memberIds").split(",").filter(Boolean);
    const template = (str(fd, "template") || "expiry") as TemplateKey;
    const channel = str(fd, "channel") || "whatsapp";
    if (!ids.length) throw new UserError("No members selected");
    const count = await mutate((db) => {
      const s = settingsOf(db);
      const plans = new Map(db.plans.map((p) => [p.id, p.name]));
      let n = 0;
      for (const id of ids) {
        const m = db.members.find((x) => x.id === id);
        if (!m) continue;
        const ctx = { name: m.name, gymName: s.gymName, planName: plans.get(m.planId), endDate: m.endDate, due: m.balanceDue };
        db.messages.push({
          id: nextId(db.messages, "MSG", 5),
          channel,
          recipientName: m.name,
          to: channel === "email" ? m.email : m.phone,
          refType: "member",
          refId: m.id,
          subject: TEMPLATES[template].subject(ctx),
          body: TEMPLATES[template].body(ctx),
          sentAt: `${today()} ${nowTime()}`,
          status: "Sent (mock)",
        });
        n++;
      }
      return n;
    });
    return ok(`${count} ${channel === "email" ? "emails" : "WhatsApp reminders"} sent (mock)`);
  });
}

// ---------- settings ----------

export async function saveSettings(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    await mutate((db) => {
      for (const key of ["gymName", "ownerName", "reminderDays", "countryCode", "dbProvider", "googleSheetId", "senderEmail", "gstNumber", "gstRate", "sacCode"]) {
        const value = str(fd, key);
        const row = db.settings.find((s) => s.key === key);
        if (row) row.value = value;
        else db.settings.push({ key, value });
      }
      
      const gstEnabled = fd.get("gstEnabled") === "on" ? "true" : "false";
      const row = db.settings.find((s) => s.key === "gstEnabled");
      if (row) row.value = gstEnabled;
      else db.settings.push({ key: "gstEnabled", value: gstEnabled });
    });
    return ok("Settings saved");
  });
}

export async function saveBranch(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    await mutate((db) => {
      const b = db.branches.find((x) => x.id === str(fd, "id"));
      if (!b) throw new UserError("Branch not found");
      Object.assign(b, { name: str(fd, "name"), address: str(fd, "address"), phone: str(fd, "phone"), manager: str(fd, "manager") });
    });
    return ok("Branch updated");
  });
}

export async function resetDemoData(): Promise<ActionResult> {
  return guarded(async () => {
    await resetDb();
    return ok("Demo data regenerated");
  });
}

export async function completeOnboarding(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    await mutate((db) => {
      const keys = ["gymName", "ownerName", "countryCode", "gstNumber", "gstRate"];
      for (const key of keys) {
        const value = str(fd, key);
        if (value) {
          const row = db.settings.find((s) => s.key === key);
          if (row) row.value = value;
          else db.settings.push({ key, value });
        }
      }
      
      const row = db.settings.find((s) => s.key === "onboardingComplete");
      if (row) row.value = "true";
      else db.settings.push({ key: "onboardingComplete", value: "true" });
    });
    return ok("Welcome aboard!");
  });
}

export async function sendVerificationOTP(email: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP temporarily in settings (mock DB)
    let senderEmail = "onboarding@cloverstudio.art";
    let gymName = "Sweat CRM";

    await mutate((db) => {
      const row = db.settings.find(s => s.key === "temp_otp");
      if (row) row.value = otp;
      else db.settings.push({ key: "temp_otp", value: otp });
      
      const emailRow = db.settings.find(s => s.key === "temp_email");
      if (emailRow) emailRow.value = email;
      else db.settings.push({ key: "temp_email", value: email });
      
      const sRow = db.settings.find(s => s.key === "senderEmail");
      if (sRow && sRow.value) senderEmail = sRow.value;
      if (senderEmail.includes("@gmail.com") || senderEmail.includes("@yahoo.com")) {
        senderEmail = "onboarding@cloverstudio.art";
      }
      const gRow = db.settings.find(s => s.key === "gymName");
      if (gRow && gRow.value) gymName = gRow.value;
    });

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
      // In mock mode, we'll cheat and return the OTP so the UI can auto-fill it for testing if needed
      return { ok: true, message: "Mock OTP sent (check console)", error: otp }; // stuffing it in error for demo purposes
    }
    
    return { ok: true, message: "OTP sent successfully" };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function verifyOTP(code: string): Promise<{ ok: boolean; error?: string }> {
  let isValid = false;
  await mutate((db) => {
    const row = db.settings.find(s => s.key === "temp_otp");
    if (row && row.value === code) {
      isValid = true;
    }
  });
  
  if (isValid) {
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

    await mutate((db) => {
      const sRow = db.settings.find(s => s.key === "senderEmail");
      if (sRow && sRow.value) senderEmail = sRow.value;
      if (senderEmail.includes("@gmail.com") || senderEmail.includes("@yahoo.com")) {
        senderEmail = "onboarding@cloverstudio.art";
      }
      const gRow = db.settings.find(s => s.key === "gymName");
      if (gRow && gRow.value) gymName = gRow.value;
    });

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
  let isValid = false;
  await mutate((db) => {
    const row = db.settings.find(s => s.key === "temp_otp");
    if (row && row.value === code) {
      isValid = true;
      // Save it as the official login email
      const loginRow = db.settings.find(s => s.key === "ownerLoginEmail");
      if (loginRow) loginRow.value = email;
      else db.settings.push({ key: "ownerLoginEmail", value: email });
    }
  });
  
  if (isValid) {
    return { ok: true };
  }
  return { ok: false, error: "Invalid OTP code" };
}

export async function requestLoginOTP(email: string): Promise<{ ok: boolean; error?: string }> {
  let isAuthorized = false;
  let gymName = "Sweat CRM";
  let senderEmail = "onboarding@cloverstudio.art";

  await mutate((db) => {
    const sRow = db.settings.find(s => s.key === "senderEmail");
    if (sRow && sRow.value) senderEmail = sRow.value;
    // Resend DMARC protection: never send from gmail/yahoo
    if (senderEmail.includes("@gmail.com") || senderEmail.includes("@yahoo.com")) {
      senderEmail = "onboarding@cloverstudio.art";
    }
    const gRow = db.settings.find(s => s.key === "gymName");
    if (gRow && gRow.value) gymName = gRow.value;
    
    const ownerEmailRow = db.settings.find(s => s.key === "ownerLoginEmail");
    const authorizedEmail = ownerEmailRow?.value || "atharvadeshmukh.dev@gmail.com";
    if (authorizedEmail === email) {
      isAuthorized = true;
    }
  });

  if (!isAuthorized) {
    return { ok: false, error: "This email is not registered as the Owner Login Email." };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await mutate((db) => {
    const row = db.settings.find(s => s.key === "temp_login_otp");
    if (row) row.value = otp;
    else db.settings.push({ key: "temp_login_otp", value: otp });
  });

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
    // Mock autofill if no key
    return { ok: true, error: otp };
  }
}

export async function loginWithOTP(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  let isValid = false;
  await mutate((db) => {
    const emailRow = db.settings.find(s => s.key === "ownerLoginEmail");
    const authorizedEmail = emailRow?.value || "atharvadeshmukh.dev@gmail.com";
    const otpRow = db.settings.find(s => s.key === "temp_login_otp");
    
    if (authorizedEmail === email && otpRow && otpRow.value === code) {
      isValid = true;
      otpRow.value = ""; // Clear OTP
    }
  });

  if (!isValid) return { ok: false, error: "Invalid or expired login code." };

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  
  redirect("/dashboard");
}

export async function logCallOutcome(fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const memberId = str(fd, "memberId");
    const outcome = str(fd, "outcome");
    const notes = str(fd, "notes");
    
    // Outcome mappings to followUpDate logic
    let followUpDays = 0;
    if (outcome === "will_pay") followUpDays = 3;
    else if (outcome === "no_answer") followUpDays = 1;
    else if (outcome === "freeze") followUpDays = 0;
    else if (outcome === "cancel") followUpDays = 0;
    else followUpDays = 7; // other

    const followUpDateStr = followUpDays > 0 ? addDays(today(), followUpDays) : "";

    await mutate((db) => {
      const staffId = "admin"; // In a real app, this comes from session
      const id = nextId(db.callLogs, "C", 5);
      
      db.callLogs.push({
        id,
        memberId,
        staffId,
        outcome,
        notes,
        followUpDate: followUpDateStr,
        createdAt: new Date().toISOString(),
      });
      
      const m = db.members.find(x => x.id === memberId);
      if (m && followUpDateStr) {
         // Maybe add a followUpDate field to member as well, but for now it's in callLogs
         // Wait, the user wants "so promised dates resurface automatically".
         // Let's add followUpDate to Member! Wait, we didn't add followUpDate to Member, only assignedStaffId. Let's add followUpDate to Member type and schema!
         (m as any).followUpDate = followUpDateStr;
      }
    });

    revalidatePath("/members");
    revalidatePath(`/members/${memberId}`);
    return { ok: true, message: "Call outcome logged" };
  });
}
