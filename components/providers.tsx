"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

// ---------- App-wide context (settings needed by client components) ----------

export type AppInfo = {
  gymName: string;
  ownerName: string;
  ownerLoginEmail: string;
  countryCode: string;
  branches: { id: string; name: string }[];
  isDemo?: boolean;
};

const AppContext = createContext<AppInfo>({ gymName: "Gym", ownerName: "Owner", ownerLoginEmail: "", countryCode: "91", branches: [], isDemo: false });
export const useApp = () => useContext(AppContext);

// ---------- Toasts ----------

type Toast = { id: number; text: string; kind: "success" | "error" };
type ToastFn = (text: string, kind?: Toast["kind"]) => void;
const ToastContext = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastContext);

export function Providers({ app, children }: { app: AppInfo; children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback<ToastFn>((text, kind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <AppContext.Provider value={app}>
      <ToastContext.Provider value={push}>
        {app.isDemo && (
          <div className="sticky top-0 z-[80] flex h-7 w-full max-w-full overflow-hidden items-center justify-center gap-2 border-b border-indigo-200/70 dark:border-indigo-500/20 bg-indigo-50/90 dark:bg-indigo-950/70 px-3 text-xs font-medium text-indigo-700 dark:text-indigo-300 backdrop-blur-md select-none">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
            </span>
            <span className="truncate">Demo Mode — Exploring preview environment</span>
          </div>
        )}
        {children}
        <div className="pointer-events-none fixed inset-x-4 bottom-20 sm:inset-x-auto sm:right-4 sm:bottom-4 z-[100] flex sm:w-full sm:max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2 rounded-lg border bg-white dark:bg-slate-900 px-4 py-3 text-sm shadow-lg transform transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
                t.kind === "error" ? "border-red-200 dark:border-red-900 text-red-700 dark:text-red-400" : "border-emerald-200 dark:border-emerald-900/50 text-slate-800 dark:text-slate-200"
              }`}
            >
              {t.kind === "error" ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              )}
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </AppContext.Provider>
  );
}
