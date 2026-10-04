import type { ReactNode } from "react";
import type { DisplayStatus } from "@/lib/types";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  slate: "bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-300",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
  red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20",
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-transparent ring-inset transition-colors ${TONES[tone]}`}>
      {children}
    </span>
  );
}

const STATUS: Record<DisplayStatus, { tone: Tone; label: string }> = {
  active: { tone: "green", label: "Active" },
  expiring: { tone: "amber", label: "Expiring soon" },
  expired: { tone: "red", label: "Expired" },
  frozen: { tone: "blue", label: "Frozen" },
  cancelled: { tone: "slate", label: "Cancelled" },
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const s = STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function leadTone(status: string): Tone {
  return ({ New: "indigo", Contacted: "blue", Trial: "violet", Converted: "green", Lost: "slate" } as Record<string, Tone>)[status] ?? "slate";
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "indigo" | "green" | "amber" | "red" | "blue" | "violet";
}) {
  const iconTone = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    red: "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    blue: "bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  }[tone];
  return (
    <div className="card p-5 transition-transform hover:scale-[1.02] duration-300">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {icon && <div className={`rounded-lg p-2 ${iconTone} transition-colors`}>{icon}</div>}
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export function Card({ title, actions, children, className = "", bodyClassName = "p-5 sm:p-6" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={`card animate-in fade-in zoom-in-95 duration-500 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.05] px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
          {actions}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-4 py-16 text-center text-sm text-slate-400 dark:text-slate-500 animate-in fade-in duration-500">{children}</div>;
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = ["bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400", "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400", "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400", "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400"];
  const color = colors[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
  const sz = { sm: "h-8 w-8 text-xs", md: "h-9 w-9 text-sm", lg: "h-14 w-14 text-lg" }[size];
  return <div className={`flex shrink-0 items-center justify-center rounded-full font-semibold transition-transform hover:scale-110 duration-200 cursor-pointer shadow-sm ${sz} ${color}`}>{initials}</div>;
}

/** Tiny dependency-free bar chart. */
export function BarChart({ data, format = (n: number) => String(n), color = "bg-indigo-500 dark:bg-indigo-400", height = 160 }: { data: { label: string; value: number; sub?: number }[]; format?: (n: number) => string; color?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.sub ?? 0)));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">{format(d.value)}</span>
          <div className="flex w-full flex-1 items-end justify-center gap-0.5">
            <div className={`w-full max-w-10 rounded-t-md transition-all duration-700 ease-out group-hover:brightness-110 ${color}`} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0 }} />
            {d.sub !== undefined && <div className="w-full max-w-10 rounded-t-md bg-rose-300 dark:bg-rose-500/50 transition-all duration-700 ease-out group-hover:brightness-110" style={{ height: `${(d.sub / max) * 100}%`, minHeight: d.sub ? 2 : 0 }} />}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ProgressBar({ value, tone = "indigo" }: { value: number; tone?: "indigo" | "amber" | "red" | "green" }) {
  const c = { indigo: "bg-indigo-500 dark:bg-indigo-400", amber: "bg-amber-500 dark:bg-amber-400", red: "bg-red-500 dark:bg-red-400", green: "bg-emerald-500 dark:bg-emerald-400" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={`h-full rounded-full transition-all duration-700 ease-out ${c}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
