"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

// ---------- App-wide context (settings needed by client components) ----------

export type AppInfo = {
  gymName: string;
  countryCode: string;
  branches: { id: string; name: string }[];
};

const AppContext = createContext<AppInfo>({ gymName: "Gym", countryCode: "91", branches: [] });
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
        {children}
        <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-sm flex-col gap-2">
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
