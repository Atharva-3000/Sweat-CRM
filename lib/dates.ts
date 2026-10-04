// Date helpers working with local "YYYY-MM-DD" strings (what we store in Excel).

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function today(): string {
  return toISODate(new Date());
}

export function nowTime(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  return parseISO(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMonth(key: string): string {
  return parseISO(`${key}-01`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function lastNMonths(n: number, from = today()): string[] {
  const d = parseISO(from);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${pad(x.getMonth() + 1)}`);
  }
  return out;
}

export function weekdayShort(iso: string): string {
  // Mon..Sun
  const idx = (parseISO(iso).getDay() + 6) % 7;
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx];
}

/** Next date (including today) that falls on the given weekday ("Mon".."Sun"). */
export function nextOccurrence(day: string, from = today()): string {
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i);
    if (weekdayShort(d) === day) return d;
  }
  return from;
}

export function formatINR(n: number): string {
  return "₹" + Math.round(n || 0).toLocaleString("en-IN");
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
