import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { settingsOf } from "@/lib/queries";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Gym Admin" };

export default async function LoginPage() {
  await connection();
  const db = await getDb();
  const s = settingsOf(db);
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 p-4">
      <LoginForm gymName={s.gymName} />
    </main>
  );
}
