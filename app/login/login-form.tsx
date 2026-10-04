"use client";

import { useActionState, useState, useTransition } from "react";
import { login, requestLoginOTP, loginWithOTP } from "@/app/actions";
import { Dumbbell, Loader2, Mail, KeyRound } from "lucide-react";

export function LoginForm({ gymName }: { gymName: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  
  const [mode, setMode] = useState<"email" | "password">("email");
  const [otpStep, setOtpStep] = useState(false);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isPendingOTP, startTransition] = useTransition();
  const [otpError, setOtpError] = useState("");

  const handleRequestOTP = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      setOtpError("");
      const res = await requestLoginOTP(email);
      if (res.ok) {
        setOtpStep(true);
        if (res.error) setOtp(res.error); // Mock autofill for dev
      } else {
        setOtpError(res.error || "Failed to send OTP");
      }
    });
  };

  const handleVerifyOTP = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      setOtpError("");
      const res = await loginWithOTP(email, otp);
      if (!res.ok) {
        setOtpError(res.error || "Invalid OTP code");
      }
    });
  };

  if (otpStep) {
    return (
      <div className="card w-full max-w-sm p-8 dark:bg-[#18181b]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold dark:text-white">Check Your Email</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">We sent a secure code to<br/><strong className="text-slate-900 dark:text-white">{email}</strong></p>
        </div>
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="label">Enter 6-digit code</label>
            <input 
              type="text" 
              value={otp || ""} 
              onChange={e => setOtp(e.target.value)} 
              className="input text-center font-mono tracking-widest text-lg" 
              placeholder="••••••" 
              required 
              autoFocus 
            />
          </div>
          {otpError && <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{otpError}</p>}
          <button type="submit" className="btn-primary w-full" disabled={isPendingOTP || otp.length < 4}>
            {isPendingOTP && <Loader2 className="h-4 w-4 animate-spin" /> }
            Verify & Sign In
          </button>
          <button type="button" onClick={() => setOtpStep(false)} className="w-full text-sm text-slate-500 hover:underline">
            Back to login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-sm p-8 dark:bg-[#18181b]">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Dumbbell className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold dark:text-white">{gymName}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to continue</p>
      </div>
      
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6">
         <button onClick={() => setMode("email")} className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-md transition-all ${mode === "email" ? "bg-white dark:bg-[#18181b] shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <Mail className="w-4 h-4" /> Email OTP
         </button>
         <button onClick={() => setMode("password")} className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-md transition-all ${mode === "password" ? "bg-white dark:bg-[#18181b] shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <KeyRound className="w-4 h-4" /> Password
         </button>
      </div>

      {mode === "email" ? (
         <form key="email-form" onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="label" htmlFor="email-input">Admin Email Address</label>
              <input id="email-input" type="email" value={email || ""} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
            </div>
            {otpError && <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{otpError}</p>}
            <button type="submit" className="btn-primary w-full" disabled={isPendingOTP}>
              {isPendingOTP && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Login Code
            </button>
         </form>
      ) : (
         <form key="password-form" action={action} className="space-y-4">
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input id="username" name="username" className="input" defaultValue="admin" autoComplete="username" required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
            </div>
            {state?.error && <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in with Password
            </button>
         </form>
      )}
    </div>
  );
}
