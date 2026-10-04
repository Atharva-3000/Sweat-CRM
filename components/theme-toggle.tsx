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
    <div className="flex bg-slate-100 dark:bg-white/[0.02] p-1 rounded-lg border border-slate-200 dark:border-white/[0.05]">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex-1 flex justify-center items-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
          theme === "light" ? "bg-white dark:bg-[#27272a] shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Sun className="h-4 w-4" /> Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`flex-1 flex justify-center items-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
          theme === "system" ? "bg-white dark:bg-[#27272a] shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Laptop className="h-4 w-4" /> System
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex-1 flex justify-center items-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
          theme === "dark" ? "bg-white dark:bg-[#27272a] shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Moon className="h-4 w-4" /> Dark
      </button>
    </div>
  );
}
