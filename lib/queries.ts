import type { Db, DisplayStatus, Member, Settings } from "./types";
import { daysBetween, today } from "./dates";

export function settingsOf(db: Db): Settings {
  const map = new Map(db.settings.map((s) => [s.key, s.value]));
  return {
    gymName: map.get("gymName") || "Sweat Fitness",
    ownerName: map.get("ownerName") || "Owner",
    reminderDays: Number(map.get("reminderDays")) || 7,
    countryCode: map.get("countryCode") || "91",
    onboardingComplete: map.get("onboardingComplete") === "true",
    dbProvider: map.get("dbProvider") || "local",
    googleSheetId: map.get("googleSheetId") || "",
    senderEmail: map.get("senderEmail") || "onboarding@cloverstudio.art",
    ownerLoginEmail: map.get("ownerLoginEmail") || "",
    gstEnabled: map.get("gstEnabled") === "true",
    gstNumber: map.get("gstNumber") || "",
    gstRate: Number(map.get("gstRate")) || 18,
    sacCode: map.get("sacCode") || "999723",
  };
}

export function inScope(branchId: string, scope: string): boolean {
  return scope === "all" || branchId === scope;
}

export function displayStatus(m: Member, reminderDays: number, T = today()): DisplayStatus {
  if (m.status === "cancelled") return "cancelled";
  if (m.status === "frozen") return "frozen";
  const left = daysBetween(T, m.endDate);
  if (left < 0) return "expired";
  if (left <= reminderDays) return "expiring";
  return "active";
}

export type MemberView = Member & {
  planName: string;
  branchName: string;
  trainerName: string;
  display: DisplayStatus;
  daysLeft: number;
  lastVisit: string;
};

export function memberViews(db: Db, scope = "all"): MemberView[] {
  const s = settingsOf(db);
  const T = today();
  const plans = new Map(db.plans.map((p) => [p.id, p.name]));
  const branches = new Map(db.branches.map((b) => [b.id, b.name]));
  const staff = new Map(db.staff.map((x) => [x.id, x.name]));
  const lastVisit = new Map<string, string>();
  for (const a of db.attendance) {
    const prev = lastVisit.get(a.memberId);
    if (!prev || a.date > prev) lastVisit.set(a.memberId, a.date);
  }
  return db.members
    .filter((m) => inScope(m.branchId, scope))
    .map((m) => ({
      ...m,
      planName: plans.get(m.planId) ?? "—",
      branchName: branches.get(m.branchId) ?? "—",
      trainerName: staff.get(m.trainerId) ?? "",
      display: displayStatus(m, s.reminderDays, T),
      daysLeft: daysBetween(T, m.endDate),
      lastVisit: lastVisit.get(m.id) ?? "",
    }));
}

export function branchShort(name: string): string {
  // "PowerHouse 1.0 – Main Road" -> "Main Road"
  const parts = name.split("–");
  return (parts[1] ?? parts[0]).trim();
}

export function memberOptionLabel(m: { id: string; name: string; phone: string }): string {
  return `${m.id} · ${m.name} · ${m.phone}`;
}

/** Parse the member id out of a datalist value like "M0001 · Rahul Sharma · 98…". */
export function parseMemberRef(v: FormDataEntryValue | null): string {
  return String(v ?? "").split("·")[0].trim().toUpperCase();
}
