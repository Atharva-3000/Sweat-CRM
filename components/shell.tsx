"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PhoneCall,
  Receipt,
  Settings,
  Tags,
  UserPlus,
  Users,
  UserCog,
  X,
  Plus,
} from "lucide-react";
import { setBranch } from "@/app/actions";
import { useApp } from "./providers";
import { GlobalSearch } from "./global-search";
import { ProfileMenu } from "./profile-menu";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/renewals", label: "Renewals & Dues", icon: Bell, badgeKey: "alerts" as const },
  { href: "/calls", label: "Call Logs", icon: PhoneCall },
  { href: "/attendance", label: "Check-in", icon: ClipboardCheck },
  { href: "/classes", label: "Classes & Bookings", icon: CalendarDays },
  { href: "/leads", label: "Enquiries", icon: UserPlus, badgeKey: "leads" as const },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/plans", label: "Plans", icon: Tags },
  { href: "/staff", label: "Staff & Trainers", icon: UserCog },
  { href: "/messages", label: "Messages", icon: MessageSquareText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Shell({
  children,
  scope,
  badges,
}: {
  children: React.ReactNode;
  scope: string;
  badges: { alerts: number; leads: number };
}) {
  const pathname = usePathname();
  const app = useApp();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
      {NAV.map(({ href, label, icon: Icon, badgeKey }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        const badge = badgeKey ? badges[badgeKey] : 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              active ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white">{badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm transition-transform hover:scale-110 hover:rotate-6 duration-300">
        <Dumbbell className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">{app.gymName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Admin panel</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-clip">
      {/* Desktop sidebar */}
      <aside className={`sticky ${app.isDemo ? "top-7 h-[calc(100vh-1.75rem)]" : "top-0 h-screen"} hidden w-64 shrink-0 flex-col border-r border-slate-200 dark:border-white/[0.05] bg-white dark:bg-[#18181b] transition-colors duration-300 lg:flex`}>
        {brand}
        {nav}
      </aside>

      {/* Mobile sidebar with slide-in & slide-out animation */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ease-out ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-slate-900/45 dark:bg-black/65 backdrop-blur-xs transition-opacity duration-300 ease-out ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-64 max-w-[80vw] flex-col bg-white dark:bg-[#18181b] border-r border-slate-200/80 dark:border-white/[0.08] shadow-2xl transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            open ? "translate-x-0" : "-translate-x-full"
          } ${app.isDemo ? "pt-7" : ""}`}
        >
          <div className="flex items-center justify-between pr-3">
            {brand}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation menu"
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {nav}
        </aside>
      </div>

      <div className="flex min-w-0 max-w-full flex-1 flex-col overflow-x-clip transition-colors duration-300">
        <header className={`sticky ${app.isDemo ? "top-7" : "top-0"} z-30 flex w-full max-w-full items-center gap-2 sm:gap-3 border-b border-slate-200 dark:border-white/[0.05] bg-white/80 dark:bg-[#18181b]/80 px-3 py-2.5 sm:px-6 sm:py-3 backdrop-blur-md transition-colors duration-300`}>
          <button className="shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05] transition-colors lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          
          <GlobalSearch />
          
          <div className="flex-1 min-w-0" />
          
          <Link href="/members/new" className="flex shrink-0 btn-primary btn-sm h-8 rounded-md px-2 sm:px-2.5" title="Add New Member">
            <Plus className="h-4 w-4" /> <span className="hidden lg:inline">New Member</span>
          </Link>
          
          <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 min-w-0 shrink">
            <span className="hidden sm:inline shrink-0">Branch</span>
            <select
              className={`input min-w-0 w-auto max-w-[110px] sm:max-w-[200px] truncate py-1.5 px-2 sm:px-3 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer ${pending ? "opacity-60" : ""}`}
              value={scope}
              onChange={(e) => startTransition(() => setBranch(e.target.value))}
            >
              <option value="all">All branches</option>
              {app.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <div className="shrink-0">
            <ProfileMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 overflow-x-hidden p-3.5 pb-28 sm:p-6 md:pb-6 animate-in fade-in duration-500">{children}</main>
      </div>
    </div>
  );
}
