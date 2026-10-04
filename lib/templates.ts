// Pre-filled message templates (safe to import from client components).
import { formatDate, formatINR } from "./dates";

export type TemplateCtx = {
  name: string;
  gymName: string;
  planName?: string;
  endDate?: string;
  due?: number;
  branchName?: string;
  interest?: string;
};

export type TemplateKey =
  | "expiry"
  | "expired"
  | "due"
  | "inactive"
  | "birthday"
  | "welcome"
  | "renewed"
  | "lead"
  | "custom";

const first = (n: string) => n.split(" ")[0];

export const TEMPLATES: Record<TemplateKey, { label: string; subject: (c: TemplateCtx) => string; body: (c: TemplateCtx) => string }> = {
  expiry: {
    label: "Membership expiring",
    subject: (c) => `Your ${c.gymName} membership expires on ${formatDate(c.endDate ?? "")}`,
    body: (c) =>
      `Hi ${first(c.name)} 👋\n\nYour ${c.planName ?? ""} membership at ${c.gymName} expires on ${formatDate(c.endDate ?? "")}.\nRenew today to keep your fitness streak going 💪\n\nReply to this message or visit the front desk to renew.\n\n– Team ${c.gymName}`,
  },
  expired: {
    label: "Membership expired (win-back)",
    subject: (c) => `We miss you at ${c.gymName}!`,
    body: (c) =>
      `Hi ${first(c.name)},\n\nYour membership at ${c.gymName} ended on ${formatDate(c.endDate ?? "")}. We miss seeing you! 🏋️\nRenew this week and get your first week of personal training FREE.\n\n– Team ${c.gymName}`,
  },
  due: {
    label: "Payment due",
    subject: (c) => `Pending balance at ${c.gymName}`,
    body: (c) =>
      `Hi ${first(c.name)},\n\nThis is a gentle reminder that a balance of ${formatINR(c.due ?? 0)} is pending on your ${c.gymName} membership.\nYou can pay via UPI or at the front desk.\n\nThank you! 🙏\n– Team ${c.gymName}`,
  },
  inactive: {
    label: "Haven't seen you lately",
    subject: (c) => `Everything okay, ${first(c.name)}?`,
    body: (c) =>
      `Hi ${first(c.name)},\n\nWe haven't seen you at ${c.gymName} for a while. Everything okay? 🙂\nYour trainer is ready whenever you are – even 30 minutes today counts!\n\n– Team ${c.gymName}`,
  },
  birthday: {
    label: "Birthday wishes",
    subject: (c) => `Happy Birthday from ${c.gymName}! 🎉`,
    body: (c) =>
      `Happy Birthday ${first(c.name)}! 🎂🎉\n\nWishing you a strong and healthy year ahead. Enjoy a FREE smoothie on us at the front desk today!\n\n– Team ${c.gymName}`,
  },
  welcome: {
    label: "Welcome",
    subject: (c) => `Welcome to ${c.gymName}!`,
    body: (c) =>
      `Welcome to ${c.gymName}, ${first(c.name)}! 🎉\n\nYour ${c.planName ?? ""} membership is active till ${formatDate(c.endDate ?? "")}.\nTimings: 5:30 AM – 10:30 PM. Don't forget your towel & water bottle 💧\n\n– Team ${c.gymName}`,
  },
  renewed: {
    label: "Renewal confirmation",
    subject: (c) => `Membership renewed – ${c.gymName}`,
    body: (c) =>
      `Hi ${first(c.name)}, thanks for renewing! ✅\n\nYour ${c.planName ?? ""} membership is now valid till ${formatDate(c.endDate ?? "")}.\n\n– Team ${c.gymName}`,
  },
  lead: {
    label: "Enquiry follow-up",
    subject: (c) => `Your free trial at ${c.gymName}`,
    body: (c) =>
      `Hi ${first(c.name)},\n\nThanks for your interest in ${c.gymName}${c.interest ? ` (${c.interest})` : ""}! 🙌\nWe'd love to invite you for a FREE trial session. When would you like to come in?\n\n– Team ${c.gymName}`,
  },
  custom: {
    label: "Custom message",
    subject: (c) => `Message from ${c.gymName}`,
    body: (c) => `Hi ${first(c.name)},\n\n`,
  },
};
