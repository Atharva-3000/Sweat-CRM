export type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
};

export type Plan = {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  description: string;
  features: string;
  active: boolean;
};

/** Stored status. "expired" / "expiring" are derived from endDate at runtime. */
export type MemberStatus = "active" | "frozen" | "cancelled";
export type DisplayStatus = "active" | "expiring" | "expired" | "frozen" | "cancelled";

export type Member = {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  dob: string;
  address: string;
  branchId: string;
  planId: string;
  trainerId: string;
  joinDate: string;
  startDate: string;
  endDate: string;
  status: MemberStatus;
  frozenOn: string;
  balanceDue: number;
  emergencyContact: string;
  notes: string;
  assignedStaffId?: string;
  followUpDate?: string;
};

export const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Bank Transfer"] as const;
export const PAYMENT_TYPES = ["New", "Renewal", "Due Payment", "Personal Training", "Other"] as const;

export type Payment = {
  id: string;
  memberId: string;
  branchId: string;
  date: string;
  amount: number;
  method: string;
  type: string;
  planId: string;
  note: string;
};

export type Attendance = {
  id: string;
  memberId: string;
  branchId: string;
  date: string;
  time: string;
};

export const STAFF_ROLES = ["Trainer", "Manager", "Front Desk", "Housekeeping"] as const;

export type Staff = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  branchId: string;
  salary: number;
  joinDate: string;
  specialization: string;
  active: boolean;
};

export const LEAD_STATUSES = ["New", "Contacted", "Trial", "Converted", "Lost"] as const;
export const LEAD_SOURCES = ["Walk-in", "Instagram", "Referral", "Google", "Website", "Flyer"] as const;

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  branchId: string;
  source: string;
  interest: string;
  status: string;
  followUpDate: string;
  createdAt: string;
  notes: string;
};

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type GymClass = {
  id: string;
  name: string;
  branchId: string;
  trainerId: string;
  day: string;
  time: string;
  durationMin: number;
  capacity: number;
};

export type Booking = {
  id: string;
  classId: string;
  memberId: string;
  date: string;
  status: string;
};

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Salaries",
  "Electricity",
  "Equipment",
  "Maintenance",
  "Marketing",
  "Supplies",
  "Other",
] as const;

export type Expense = {
  id: string;
  branchId: string;
  date: string;
  category: string;
  amount: number;
  note: string;
};

export type Channel = "whatsapp" | "sms" | "email" | "call";

export type Message = {
  id: string;
  channel: string;
  recipientName: string;
  to: string;
  refType: string;
  refId: string;
  subject: string;
  body: string;
  sentAt: string;
  status: string;
};

export type SettingRow = { key: string; value: string };

export type Settings = {
  gymName: string;
  reminderDays: number;
  countryCode: string;
  ownerName: string;
  onboardingComplete: boolean;
  dbProvider?: string;
  googleSheetId?: string;
  senderEmail?: string;
  ownerLoginEmail?: string;
  gstEnabled?: boolean;
  gstNumber?: string;
  gstRate?: number;
  sacCode?: string;
};

export interface CallLog {
  id: string;
  memberId: string;
  staffId: string;
  outcome: string;
  notes: string;
  followUpDate: string;
  createdAt: string;
}

export interface Tables {
  settings: SettingRow;
  branches: Branch;
  plans: Plan;
  members: Member;
  payments: Payment;
  attendance: Attendance;
  staff: Staff;
  leads: Lead;
  classes: GymClass;
  bookings: Booking;
  expenses: Expense;
  messages: Message;
  callLogs: CallLog;
}

export type Db = { [K in keyof Tables]: Tables[K][] };

export type ActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; error: string };
