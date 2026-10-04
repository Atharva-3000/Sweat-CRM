import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BRANCH_COOKIE, SESSION_COOKIE, isValidToken } from "./session";

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return isValidToken(store.get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthed())) redirect("/login");
}

/** "all" or a branch id, chosen from the branch switcher in the top bar. */
export async function getBranchScope(): Promise<string> {
  const store = await cookies();
  return store.get(BRANCH_COOKIE)?.value || "all";
}
