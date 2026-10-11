"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import { Search, X, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchMembers } from "@/app/actions";
import { StatusBadge } from "@/components/ui";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; phone: string; status: any }[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [vvStyle, setVvStyle] = useState<React.CSSProperties>({ bottom: "1.15rem", left: 0, right: 0 });

  useEffect(() => {
    setMounted(true);
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

    const updateViewportPosition = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setVvStyle({ bottom: "1.15rem", left: 0, right: 0 });
        return;
      }
      const layoutH = window.innerHeight;
      const hiddenBottom = Math.max(0, layoutH - (vv.offsetTop + vv.height));
      setVvStyle({
        bottom: `${18 + hiddenBottom}px`,
        left: `${vv.offsetLeft}px`,
        width: `${vv.width}px`,
      });
    };

    updateViewportPosition();
    window.addEventListener("resize", updateViewportPosition, { passive: true });
    window.addEventListener("scroll", updateViewportPosition, { passive: true });
    window.visualViewport?.addEventListener("resize", updateViewportPosition);
    window.visualViewport?.addEventListener("scroll", updateViewportPosition);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("resize", updateViewportPosition);
      window.removeEventListener("scroll", updateViewportPosition);
      window.visualViewport?.removeEventListener("resize", updateViewportPosition);
      window.visualViewport?.removeEventListener("scroll", updateViewportPosition);
    };
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
      {/* Desktop top-bar search trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-100 dark:bg-[#18181b]/50 hover:bg-slate-200 dark:hover:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05] rounded-lg transition-colors min-w-[250px]"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded-md bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05]">⌘K</kbd>
      </button>

      {/* Mobile & smaller screens sticky bottom Apple Liquid Glass search bar */}
      {mounted &&
        createPortal(
          <div
            style={vvStyle}
            className="pointer-events-none fixed z-40 flex justify-center px-4 md:hidden"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open Magic Search"
              className="pointer-events-auto liquid-glass-pill group flex w-full max-w-sm cursor-pointer items-center gap-3 rounded-full px-3.5 py-2.5 text-left text-sm transition-transform duration-300 hover:scale-[1.01] active:scale-[0.98]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-violet-500 to-sky-400 text-white shadow-sm shadow-indigo-500/30 transition-transform duration-300 group-hover:rotate-12">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-600 dark:text-slate-300">
                Search members, phone, ID...
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900/5 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                <Search className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>,
          document.body
        )}

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] sm:pt-[15vh]">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setOpen(false)} />
            
            <div className="relative w-full max-w-2xl mx-3 sm:mx-4 bg-white dark:bg-[#27272a] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[82vh]">
              <div className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-white/[0.05]">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search members by name, phone, or ID..."
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-base sm:text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                  }}
                />
                {isPending && <div className="h-4 w-4 shrink-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />}
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {results.length > 0 && (
                <div className="overflow-y-auto p-2.5 sm:p-3 space-y-1.5">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Members</div>
                  {results.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setOpen(false);
                        router.push(`/members/${m.id}`);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-semibold text-xs sm:text-sm shrink-0">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate">{m.name}</div>
                          <div className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{m.phone} · {m.id}</div>
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </button>
                  ))}
                </div>
              )}

              {query.length > 0 && results.length === 0 && !isPending && (
                <div className="p-10 sm:p-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No members found for &ldquo;{query}&rdquo;.
                </div>
              )}
              
              {query.length === 0 && (
                <div className="p-5 sm:p-6 text-center text-xs sm:text-sm text-slate-500 flex flex-col items-center gap-3 opacity-70">
                  <p className="sm:hidden text-xs text-slate-400">Type a member&apos;s name, phone number, or ID</p>
                  <div className="hidden sm:flex gap-2 items-center">
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
          </div>,
          document.body
        )}
    </>
  );
}
