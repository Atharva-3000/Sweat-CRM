/**
 * Excel-backed "database".
 *
 * Every table lives in its own worksheet inside data/gym-db.xlsx. The first row
 * holds the column names, every following row is a record. You can open the
 * file in Excel / Google Sheets / Numbers and edit it by hand – changes are
 * picked up automatically (the cache is keyed on the file's modified time).
 *
 * This is intentionally simple and meant for demos: the whole workbook is read
 * into memory and every write rewrites the file.
 */
import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import type { Db, Tables } from "./types";
import { generateSeed } from "./seed";

type ColType = "s" | "n" | "b";
type Schema = { [K in keyof Tables]: { sheet: string; cols: Record<keyof Tables[K] & string, ColType> } };

export const SCHEMA: Schema = {
  settings: { sheet: "Settings", cols: { key: "s", value: "s" } },
  branches: { sheet: "Branches", cols: { id: "s", name: "s", address: "s", phone: "s", manager: "s" } },
  plans: {
    sheet: "Plans",
    cols: { id: "s", name: "s", durationDays: "n", price: "n", description: "s", features: "s", active: "b" },
  },
  members: {
    sheet: "Members",
    cols: {
      id: "s",
      name: "s",
      phone: "s",
      email: "s",
      gender: "s",
      dob: "s",
      address: "s",
      branchId: "s",
      planId: "s",
      trainerId: "s",
      joinDate: "s",
      startDate: "s",
      endDate: "s",
      status: "s",
      frozenOn: "s",
      balanceDue: "n",
      emergencyContact: "s",
      notes: "s",
      assignedStaffId: "s",
      followUpDate: "s",
    },
  },
  payments: {
    sheet: "Payments",
    cols: {
      id: "s",
      memberId: "s",
      branchId: "s",
      date: "s",
      amount: "n",
      method: "s",
      type: "s",
      planId: "s",
      note: "s",
    },
  },
  attendance: {
    sheet: "Attendance",
    cols: { id: "s", memberId: "s", branchId: "s", date: "s", time: "s" },
  },
  staff: {
    sheet: "Staff",
    cols: {
      id: "s",
      name: "s",
      role: "s",
      phone: "s",
      email: "s",
      branchId: "s",
      salary: "n",
      joinDate: "s",
      specialization: "s",
      active: "b",
    },
  },
  leads: {
    sheet: "Leads",
    cols: {
      id: "s",
      name: "s",
      phone: "s",
      email: "s",
      branchId: "s",
      source: "s",
      interest: "s",
      status: "s",
      followUpDate: "s",
      createdAt: "s",
      notes: "s",
    },
  },
  classes: {
    sheet: "Classes",
    cols: {
      id: "s",
      name: "s",
      branchId: "s",
      trainerId: "s",
      day: "s",
      time: "s",
      durationMin: "n",
      capacity: "n",
    },
  },
  bookings: {
    sheet: "Bookings",
    cols: { id: "s", classId: "s", memberId: "s", date: "s", status: "s" },
  },
  expenses: {
    sheet: "Expenses",
    cols: { id: "s", branchId: "s", date: "s", category: "s", amount: "n", note: "s" },
  },
  messages: {
    sheet: "Messages",
    cols: {
      id: "s",
      channel: "s",
      recipientName: "s",
      to: "s",
      refType: "s",
      refId: "s",
      subject: "s",
      body: "s",
      sentAt: "s",
      status: "s",
    },
  },
  callLogs: {
    sheet: "CallLogs",
    cols: {
      id: "s",
      memberId: "s",
      staffId: "s",
      outcome: "s",
      notes: "s",
      followUpDate: "s",
      createdAt: "s",
    }
  }
};

const TABLES = Object.keys(SCHEMA) as (keyof Tables)[];

export const DATA_DIR = process.env.GYM_DATA_DIR || path.join(process.cwd(), "data");
export const DB_FILE = path.join(DATA_DIR, "gym-db.xlsx");

// ---------- cache + write lock (kept on globalThis to survive dev HMR) ----------

type Store = { cache: { mtimeMs: number; db: Db } | null; lock: Promise<unknown> };
const g = globalThis as unknown as { __gymDbStore?: Store };
const store: Store = (g.__gymDbStore ??= { cache: null, lock: Promise.resolve() });

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = store.lock.then(fn, fn);
  store.lock = run.catch(() => undefined);
  return run;
}

// ---------- cell <-> value conversion ----------

function cellToPrimitive(v: ExcelJS.CellValue): string | number | boolean | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) {
    // Excel dates come back as UTC midnight.
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("text" in v) return String(v.text);
    if ("result" in v) return cellToPrimitive(v.result as ExcelJS.CellValue);
    if ("error" in v) return null;
    return String(v);
  }
  return v;
}

function coerce(v: string | number | boolean | null, t: ColType): string | number | boolean {
  if (t === "n") {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
    return Number.isFinite(n) ? n : 0;
  }
  if (t === "b") {
    if (typeof v === "boolean") return v;
    return ["true", "yes", "1", "y"].includes(String(v ?? "").trim().toLowerCase());
  }
  return v === null ? "" : String(v);
}

// ---------- read / write ----------

async function readWorkbook(): Promise<Db> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(DB_FILE);
  const db = {} as Db;
  for (const table of TABLES) {
    const { sheet, cols } = SCHEMA[table];
    const ws = wb.getWorksheet(sheet);
    const rows: Record<string, unknown>[] = [];
    if (ws) {
      const header = new Map<string, number>();
      ws.getRow(1).eachCell((cell, col) => {
        const name = String(cellToPrimitive(cell.value) ?? "").trim();
        if (name) header.set(name, col);
      });
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rec: Record<string, unknown> = {};
        let hasValue = false;
        for (const [key, type] of Object.entries(cols) as [string, ColType][]) {
          const idx = header.get(key);
          const raw = idx ? cellToPrimitive(row.getCell(idx).value) : null;
          if (raw !== null && raw !== "") hasValue = true;
          rec[key] = coerce(raw, type);
        }
        if (hasValue) rows.push(rec);
      });
    }
    (db as Record<string, unknown>)[table] = rows;
  }
  return db;
}

async function writeWorkbook(db: Db): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gym Admin";
  wb.created = new Date();
  for (const table of TABLES) {
    const { sheet, cols } = SCHEMA[table];
    const ws = wb.addWorksheet(sheet, { views: [{ state: "frozen", ySplit: 1 }] });
    const keys = Object.keys(cols);
    ws.columns = keys.map((k) => ({
      header: k,
      key: k,
      width: Math.min(40, Math.max(12, k.length + 4, ...((db[table] || []) as any[]).slice(0, 50).map((r) => String((r as Record<string, unknown>)[k] ?? "").length + 2))),
    }));
    ws.addRows((db[table] || []) as unknown as Record<string, unknown>[]);
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  await wb.xlsx.writeFile(tmp);
  await fs.rename(tmp, DB_FILE);
}

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    await writeWorkbook(generateSeed());
  }
}

/** Load the whole database (cached until the file changes on disk). */
export async function getDb(): Promise<Db> {
  await ensureFile();
  const { mtimeMs } = await fs.stat(DB_FILE);
  if (store.cache && store.cache.mtimeMs === mtimeMs) return store.cache.db;
  const db = await readWorkbook();
  store.cache = { mtimeMs, db };
  return db;
}

/**
 * Run a mutation against a fresh copy of the database and persist it.
 * Mutations are serialized so concurrent requests can't clobber each other.
 */
export function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  return withLock(async () => {
    const current = await getDb();
    const db = structuredClone(current);
    const result = await fn(db);
    await writeWorkbook(db);
    const { mtimeMs } = await fs.stat(DB_FILE);
    store.cache = { mtimeMs, db };
    return result;
  });
}

/** Wipe everything and regenerate demo data. */
export function resetDb(): Promise<void> {
  return withLock(async () => {
    const db = generateSeed();
    await writeWorkbook(db);
    const { mtimeMs } = await fs.stat(DB_FILE);
    store.cache = { mtimeMs, db };
  });
}

/** Next sequential id like M0042 for a given prefix. */
export function nextId(rows: { id: string }[], prefix: string, width = 4): string {
  let max = 0;
  for (const r of rows) {
    if (r.id.startsWith(prefix)) {
      const n = parseInt(r.id.slice(prefix.length), 10);
      if (n > max) max = n;
    }
  }
  return prefix + String(max + 1).padStart(width, "0");
}
