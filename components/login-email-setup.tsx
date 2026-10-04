"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "./providers";
import { sendVerificationOTP, verifyAndSaveLoginEmail } from "@/app/actions";

export function LoginEmailSetup({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [step, setStep] = useState<"idle" | "otp" | "verified">(defaultEmail ? "verified" : "idle");
  const [otp, setOtp] = useState("");
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const handleSend = () => {
    if (!email.includes("@")) {
      toast("Enter a valid email", "error");
      return;
    }
    startTransition(async () => {
      const res = await sendVerificationOTP(email);
      if (res.ok) {
        toast("OTP sent to your email");
        if (res.error) setOtp(res.error); // Mock autofill
        setStep("otp");
      } else {
        toast(res.error || "Failed to send OTP", "error");
      }
    });
  };

  const handleVerify = () => {
    if (otp.length < 4) return;
    startTransition(async () => {
      const res = await verifyAndSaveLoginEmail(email, otp);
      if (res.ok) {
        toast("Login email verified successfully!");
        setStep("verified");
      } else {
        toast(res.error || "Invalid OTP", "error");
      }
    });
  };

  return (
    <div className="space-y-4">
      {step === "verified" && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-900 dark:text-emerald-300">Login Email Verified</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400/80">You can now use <strong>{email}</strong> to log in via OTP.</p>
            <button type="button" onClick={() => setStep("idle")} className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline mt-2">Change Email</button>
          </div>
        </div>
      )}

      {step === "idle" && (
        <div>
          <label className="label">Owner Login Email</label>
          <div className="flex gap-2">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            <button type="button" onClick={handleSend} disabled={pending || !email} className="btn-primary whitespace-nowrap">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Email"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Verify this email to enable secure passwordless login.</p>
        </div>
      )}

      {step === "otp" && (
        <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl space-y-3">
           <p className="text-sm font-medium">Enter the code sent to {email}</p>
           <div className="flex gap-2">
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="input text-center font-mono tracking-widest" placeholder="••••••" />
            <button type="button" onClick={handleVerify} disabled={pending || otp.length < 4} className="btn-primary whitespace-nowrap">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Code"}
            </button>
          </div>
          <button type="button" onClick={() => setStep("idle")} className="text-xs text-slate-500 hover:underline">Cancel</button>
        </div>
      )}
    </div>
  );
}
