"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { checkIn } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Avatar, Badge, StatusBadge } from "@/components/ui";
import type { DisplayStatus } from "@/lib/types";

export type CheckInMemberOption = {
  id: string;
  name: string;
  phone: string;
  display: DisplayStatus;
  planName?: string;
  checkedInToday?: boolean;
};

export function QuickCheckIn({
  members,
  date,
}: {
  members: CheckInMemberOption[];
  date: string;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CheckInMemberOption | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce typed query by 250ms
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setDebouncedQuery("");
      setIsDebouncing(false);
      return;
    }
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
      setIsDebouncing(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestion dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return [];
    return members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.id.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [debouncedQuery, members]);

  useEffect(() => {
    setActiveIndex(0);
  }, [suggestions]);

  const handleSelect = (member: CheckInMemberOption) => {
    setSelected(member);
    setQuery(`${member.name} (${member.phone})`);
    setOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <ActionForm
      action={checkIn}
      onSuccess={() => {
        setSelected(null);
        setQuery("");
        setDebouncedQuery("");
        setOpen(false);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="date" value={date} />
      <input
        type="hidden"
        name="member"
        value={selected ? selected.id : suggestions.length === 1 ? suggestions[0].id : query.trim()}
      />

      <div ref={containerRef} className="relative">
        <label className="label">Select Member</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            required
            autoComplete="off"
            value={query}
            placeholder="Search member by name, phone, or ID..."
            className="input pl-9 pr-9"
            onFocus={() => {
              if (query.trim().length > 0 && !selected) {
                setOpen(true);
              }
            }}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (selected) setSelected(null);
              setOpen(val.trim().length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                return;
              }
              if (!open || suggestions.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % suggestions.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
              } else if (e.key === "Enter" && !selected) {
                const pick = suggestions[activeIndex];
                if (pick) {
                  e.preventDefault();
                  handleSelect(pick);
                }
              }
            }}
          />
          {isDebouncing ? (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-500" />
          ) : (
            (query.length > 0 || selected) && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear selection"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.08] dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )
          )}
        </div>

        {/* Selected Member Indicator */}
        {selected && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-500/10 px-3 py-2 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={selected.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-white">
                  {selected.name} <span className="font-normal text-slate-500">({selected.id})</span>
                </p>
                <p className="truncate text-slate-500 dark:text-slate-400">
                  {selected.phone} {selected.planName ? `· ${selected.planName}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {selected.checkedInToday && <Badge tone="blue">Checked in</Badge>}
              <StatusBadge status={selected.display} />
            </div>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {open && !selected && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {isDebouncing ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                <span>Searching members...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-0.5">
                {suggestions.map((m, idx) => {
                  const isHighlighted = idx === activeIndex;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelect(m)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        isHighlighted
                          ? "bg-indigo-50/80 dark:bg-indigo-500/15"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={m.name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
                              {m.name}
                            </span>
                            <span className="shrink-0 text-[11px] font-mono text-slate-400">
                              {m.id}
                            </span>
                          </div>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {m.phone} {m.planName ? `· ${m.planName}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.checkedInToday && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                            <Check className="h-3 w-3" /> In today
                          </span>
                        )}
                        <StatusBadge status={m.display} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No members found matching &ldquo;{debouncedQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      <SubmitButton className="btn-primary w-full">Record Check-in</SubmitButton>
    </ActionForm>
  );
}
