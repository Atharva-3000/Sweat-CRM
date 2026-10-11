"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, CreditCard, Receipt, Sparkles, UserPlus, ExternalLink } from "lucide-react";
import { Modal } from "./modal";
import { Avatar, Badge, StatusBadge } from "./ui";
import { formatINR } from "@/lib/dates";
import type { DisplayStatus } from "@/lib/types";

export type MonthPaymentDetail = {
  id: string;
  date: string;
  amount: number;
  method: string;
  type: string;
  note: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  planName: string;
};

export type MonthAdmissionDetail = {
  id: string;
  name: string;
  phone: string;
  planName: string;
  joinDate: string;
  display: DisplayStatus;
  amountPaid: number;
};

export type RevenueMonthItem = {
  monthKey: string;
  label: string;
  fullLabel: string;
  value: number;
  payments: MonthPaymentDetail[];
  admissions: MonthAdmissionDetail[];
};

export function RevenueChart({
  data,
  height = 250,
}: {
  data: RevenueMonthItem[];
  height?: number;
}) {
  const [selectedMonth, setSelectedMonth] = useState<RevenueMonthItem | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  const newAdmissionsRevenue = selectedMonth
    ? selectedMonth.payments
        .filter((p) => p.type === "New")
        .reduce((acc, p) => acc + p.amount, 0)
    : 0;

  const renewalsRevenue = selectedMonth
    ? selectedMonth.payments
        .filter((p) => p.type !== "New")
        .reduce((acc, p) => acc + p.amount, 0)
    : 0;

  return (
    <>
      <div className="mb-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Click on any month&apos;s bar to inspect admissions &amp; payment breakdown</span>
      </div>

      <div className="flex w-full min-w-0 items-end gap-1 sm:gap-3" style={{ height }}>
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          return (
            <button
              key={d.monthKey}
              type="button"
              onClick={() => setSelectedMonth(d)}
              className="group flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-end gap-1 sm:gap-1.5 rounded-lg p-0.5 sm:p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              title={`View details for ${d.fullLabel} (${formatINR(d.value)})`}
            >
              <span className="max-w-full truncate text-[9px] sm:text-[11px] font-semibold tracking-tighter sm:tracking-normal text-slate-700 dark:text-slate-200 opacity-80 transition-all duration-200 group-hover:opacity-100 group-hover:scale-105">
                {formatINR(d.value)}
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-12 rounded-t-md sm:rounded-t-lg bg-indigo-500 dark:bg-indigo-400 transition-all duration-500 ease-out group-hover:bg-indigo-600 dark:group-hover:bg-indigo-300 group-hover:shadow-md group-hover:shadow-indigo-500/20"
                  style={{
                    height: `${pct}%`,
                    minHeight: d.value ? 6 : 2,
                  }}
                />
              </div>
              <div className="flex w-full min-w-0 flex-col items-center">
                <span className="max-w-full truncate text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {d.label}
                </span>
                <span className="max-w-full truncate text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500">
                  {d.admissions.length} joined
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Modal
        open={!!selectedMonth}
        onClose={() => setSelectedMonth(null)}
        title={
          selectedMonth ? (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>{selectedMonth.fullLabel} — Revenue &amp; Admissions</span>
            </div>
          ) : (
            "Revenue Breakdown"
          )
        }
        size="lg"
      >
        {selectedMonth && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* KPI Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-3.5">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-500" /> Total Revenue
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  {formatINR(selectedMonth.value)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedMonth.payments.length} payment{selectedMonth.payments.length === 1 ? "" : "s"} recorded
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/[0.06] p-3.5">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" /> New Admissions
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-300">
                  {selectedMonth.admissions.length} Member{selectedMonth.admissions.length === 1 ? "" : "s"}
                </p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                  {formatINR(newAdmissionsRevenue)} from new joins
                </p>
              </div>

              <div className="rounded-xl border border-amber-200/70 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/[0.06] p-3.5">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Renewals &amp; Dues
                </p>
                <p className="mt-1 text-xl font-bold text-amber-900 dark:text-amber-300">
                  {formatINR(renewalsRevenue)}
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  From renewals &amp; balance dues
                </p>
              </div>
            </div>

            {/* New Admissions List */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2.5 flex items-center justify-between">
                <span>Admissions in {selectedMonth.fullLabel}</span>
                <Badge tone="green">{selectedMonth.admissions.length} joined</Badge>
              </h3>
              {selectedMonth.admissions.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
                  {selectedMonth.admissions.map((adm) => (
                    <div
                      key={adm.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-[#18181b] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={adm.name} size="sm" />
                        <div className="min-w-0">
                          <Link
                            href={`/members/${adm.id}`}
                            onClick={() => setSelectedMonth(null)}
                            className="text-sm font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1 truncate"
                          >
                            {adm.name}
                            <span className="text-xs font-normal text-slate-400">({adm.id})</span>
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {adm.planName} · Joined {adm.joinDate} · {adm.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {adm.amountPaid > 0 && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatINR(adm.amountPaid)}
                          </span>
                        )}
                        <StatusBadge status={adm.display} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 dark:border-white/[0.08] py-6 text-center text-xs text-slate-400">
                  No new member admissions recorded in {selectedMonth.fullLabel}.
                </p>
              )}
            </div>

            {/* All Payments Breakdown */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2.5 flex items-center justify-between">
                <span>All Revenue Transactions</span>
                <Badge tone="indigo">{selectedMonth.payments.length} transactions</Badge>
              </h3>
              {selectedMonth.payments.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02]">
                        <th className="th">Date</th>
                        <th className="th">Member</th>
                        <th className="th">Type / Plan</th>
                        <th className="th">Method</th>
                        <th className="th text-right">Amount</th>
                        <th className="th text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                      {selectedMonth.payments.map((p) => {
                        const typeTone =
                          p.type === "New"
                            ? "green"
                            : p.type === "Renewal"
                            ? "indigo"
                            : "amber";
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                            <td className="td whitespace-nowrap text-xs text-slate-500">
                              {p.date}
                            </td>
                            <td className="td">
                              <Link
                                href={`/members/${p.memberId}`}
                                onClick={() => setSelectedMonth(null)}
                                className="font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                              >
                                {p.memberName}
                              </Link>
                              <div className="text-xs text-slate-400">{p.memberId}</div>
                            </td>
                            <td className="td">
                              <div className="flex items-center gap-1.5">
                                <Badge tone={typeTone}>{p.type}</Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                  {p.planName}
                                </span>
                              </div>
                              {p.note && (
                                <p className="text-[11px] text-slate-400 mt-0.5">{p.note}</p>
                              )}
                            </td>
                            <td className="td text-xs text-slate-600 dark:text-slate-300">
                              {p.method}
                            </td>
                            <td className="td text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {formatINR(p.amount)}
                            </td>
                            <td className="td text-right">
                              <Link
                                href={`/receipts/${p.id}`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                title="View Receipt"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 dark:border-white/[0.08] py-6 text-center text-xs text-slate-400">
                  No payments recorded in {selectedMonth.fullLabel}.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
