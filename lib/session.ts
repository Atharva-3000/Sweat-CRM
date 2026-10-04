import crypto from "node:crypto";

// Demo credentials (requested): admin / 12345
export const ADMIN_USER = "admin";
export const ADMIN_PASS = "12345";

export const SESSION_COOKIE = "gym_session";
export const BRANCH_COOKIE = "gym_branch";

const SECRET = process.env.SESSION_SECRET || "powerhouse-demo-secret";

export function sessionToken(): string {
  return crypto.createHmac("sha256", SECRET).update(ADMIN_USER).digest("hex");
}

export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = sessionToken();
  return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
