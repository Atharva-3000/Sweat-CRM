"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { Search, X, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchMembers } from "@/app/actions";
import { StatusBadge } from "@/components/ui";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; phone: string; status: any }[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await searchMembers(query);
        setResults(res as any);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-100 dark:bg-[#18181b]/50 hover:bg-slate-200 dark:hover:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05] rounded-lg transition-colors min-w-[250px]"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded-md bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05]">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setOpen(false)} />
          
          <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-[#27272a] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-white/[0.05]">
              <Search className="h-6 w-6 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search members by name, phone, or ID..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                }}
              />
              {isPending && <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />}
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {results.length > 0 && (
              <div className="overflow-y-auto p-3 space-y-1.5">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Members</div>
                {results.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/members/${m.id}`);
                    }}
                    className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-semibold text-sm shrink-0">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-base">{m.name}</div>
                        <div className="text-sm text-slate-500 mt-0.5">{m.phone} · {m.id}</div>
                      </div>
                    </div>
                    <StatusBadge status={m.status} />
                  </button>
                ))}
              </div>
            )}

            {query.length > 0 && results.length === 0 && !isPending && (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                No members found for "{query}".
              </div>
            )}
            
            {query.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-500 flex flex-col items-center gap-3 opacity-60">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/[0.05] rounded border border-slate-200 dark:border-white/[0.1] font-sans">↑↓</kbd>
                  <span>to navigate</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/[0.05] rounded border border-slate-200 dark:border-white/[0.1] font-sans ml-3">↵</kbd>
                  <span>to open</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/[0.05] rounded border border-slate-200 dark:border-white/[0.1] font-sans ml-3">esc</kbd>
                  <span>to close</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
