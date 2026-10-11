"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, ShieldCheck, User } from "lucide-react";
import { logout, saveProfileSettings } from "@/app/actions";
import { useApp } from "./providers";
import { ThemeToggle } from "./theme-toggle";
import { Modal } from "./modal";
import { ActionForm, SubmitButton } from "./action-form";
import { LoginEmailSetup } from "./login-email-setup";

function getInitials(name?: string) {
  const cleaned = (name || "").trim();
  if (!cleaned || cleaned.toLowerCase() === "owner") return "AD";
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function ProfileMenu() {
  const app = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(app.ownerName);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full p-0.5 pr-2 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        title="Profile & Settings"
        aria-expanded={dropdownOpen}
        aria-haspopup="menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-400 shadow-sm border border-indigo-200 dark:border-indigo-500/30">
          {initials}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
            dropdownOpen ? "rotate-180 text-slate-900 dark:text-white" : "rotate-0"
          }`}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-80 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {app.ownerName || "Admin"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {app.ownerLoginEmail || "Admin account"}
              </p>
            </div>
          </div>

          {/* Inline Theme Toggle */}
          <div className="px-2.5 py-2.5 border-b border-slate-100 dark:border-white/[0.06]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 px-0.5">
              Appearance
            </p>
            <ThemeToggle />
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setProfileModalOpen(true);
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              Profile & Security
            </button>
          </div>

          {/* Logout */}
          <form action={logout} className="border-t border-slate-100 dark:border-white/[0.06] pt-1">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </form>
        </div>
      )}

      <Modal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Profile & Security"
        size="md"
      >
        <div className="space-y-6">
          <ActionForm
            action={saveProfileSettings}
            onSuccess={() => setProfileModalOpen(false)}
            className="space-y-4"
          >
            <div>
              <label className="label flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Owner Name
              </label>
              <div className="flex gap-2">
                <input
                  name="ownerName"
                  required
                  className="input"
                  defaultValue={app.ownerName}
                  placeholder="Your Name"
                />
                <SubmitButton className="btn-primary">Save</SubmitButton>
              </div>
            </div>
          </ActionForm>

          <div className="border-t border-slate-100 dark:border-white/[0.08] pt-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Admin Login Security
            </h3>
            <LoginEmailSetup defaultEmail={app.ownerLoginEmail || ""} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
