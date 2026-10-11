"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Laptop } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-full animate-pulse bg-slate-100 dark:bg-white/[0.05] rounded-lg" />;
  }

  return (
    <div className="flex w-full bg-slate-100 dark:bg-white/[0.04] p-1 rounded-lg border border-slate-200 dark:border-white/[0.06]">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`min-w-0 flex-1 flex justify-center items-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
          theme === "light" ? "bg-white dark:bg-[#27272a] shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Sun className="h-3.5 w-3.5 shrink-0" /> Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`min-w-0 flex-1 flex justify-center items-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
          theme === "system" ? "bg-white dark:bg-[#27272a] shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Laptop className="h-3.5 w-3.5 shrink-0" /> System
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`min-w-0 flex-1 flex justify-center items-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
          theme === "dark" ? "bg-white dark:bg-[#27272a] shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Moon className="h-3.5 w-3.5 shrink-0" /> Dark
      </button>
    </div>
  );
}
