"use client";

import { useState, useEffect, useTransition } from "react";
import { Dumbbell, ArrowRight, CheckCircle2, User, Building2, Globe, Moon, Sun, Settings2,
  Receipt, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { ActionForm } from "./action-form";
import { completeOnboarding, sendVerificationOTP, verifyOTP } from "@/app/actions";
import { useToast } from "./providers";

export function Onboarding({
  defaultGymName,
  defaultOwnerName,
  defaultCountryCode,
}: {
  defaultGymName: string;
  defaultOwnerName: string;
  defaultCountryCode: string;
}) {
  const [step, setStep] = useState(1);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingOTP, startOTPTransition] = useTransition();
  const toast = useToast();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendOTP = () => {
    if (!email.includes("@")) {
      toast("Please enter a valid email address.", "error");
      return;
    }
    startOTPTransition(async () => {
      const res = await sendVerificationOTP(email);
      if (res.ok) {
        if (res.message) toast(res.message);
        if (res.error) setOtp(res.error); // Autofill mock OTP
        setStep(2);
      } else {
        toast(res.error || "Failed to send OTP", "error");
      }
    });
  };

  const handleVerifyOTP = () => {
    if (otp.length < 4) return;
    startOTPTransition(async () => {
      const res = await verifyOTP(otp);
      if (res.ok) {
        setStep(3);
      } else {
        toast(res.error || "Invalid OTP", "error");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-[#09090b]">
      <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 pointer-events-none" />
      <div className="relative w-full max-w-xl mx-4 bg-white dark:bg-[#18181b] rounded-2xl shadow-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        
        {/* Progress Bar */}
        <div className="flex w-full h-1 bg-slate-100 dark:bg-white/[0.05]">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sweat CRM
            </h1>
          </div>

          <ActionForm action={completeOnboarding} className="space-y-8">
            {/* Step 1: Info */}
            <div className={`transition-all duration-500 ${step === 1 ? "block animate-in slide-in-from-right-4 fade-in" : "hidden"}`}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome! Let's get started.</h2>
                <p className="text-slate-500 dark:text-slate-400">First, tell us a bit about your business.</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="label flex items-center gap-2"><User className="w-3.5 h-3.5" /> Your Name</label>
                  <input name="ownerName" type="text" required defaultValue={defaultOwnerName} className="input text-lg py-3" placeholder="John Doe" />
                </div>
                <div>
                  <label className="label flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Gym Name</label>
                  <input name="gymName" type="text" required defaultValue={defaultGymName} className="input text-lg py-3" placeholder="Iron Temple Fitness" />
                </div>
                <div>
                  <label className="label flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Verification Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input text-lg py-3" placeholder="you@example.com" />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button type="button" onClick={handleSendOTP} disabled={pendingOTP || !email} className="btn-primary text-base px-6 py-2.5">
                  {pendingOTP ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify Email <ArrowRight className="w-4 h-4 ml-1" /></>}
                </button>
              </div>
            </div>

            {/* Step 2: OTP */}
            <div className={`transition-all duration-500 ${step === 2 ? "block animate-in slide-in-from-right-4 fade-in" : "hidden"}`}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check your inbox</h2>
                <p className="text-slate-500 dark:text-slate-400">We sent a verification code to <strong className="text-slate-900 dark:text-slate-200">{email}</strong>.</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="label flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Security Code</label>
                  <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} className="input text-center text-3xl tracking-[0.5em] font-mono py-4" placeholder="••••••" />
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary text-base px-6 py-2.5">Back</button>
                <button type="button" onClick={handleVerifyOTP} disabled={pendingOTP || otp.length < 4} className="btn-primary text-base px-6 py-2.5">
                  {pendingOTP ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm Code <ArrowRight className="w-4 h-4 ml-1" /></>}
                </button>
              </div>
            </div>

                        {/* Step 3: Localization & GST */}
            <div className={`transition-all duration-500 ${step === 3 ? "block animate-in slide-in-from-right-4 fade-in" : "hidden"}`}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Localization & Billing</h2>
                <p className="text-slate-500 dark:text-slate-400">Set your region and optional GST settings.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="label flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> WhatsApp Country Code</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-lg font-mono">+</span>
                    <input name="countryCode" type="number" required defaultValue={defaultCountryCode} className="input text-lg py-3 font-mono" placeholder="91" />
                  </div>
                </div>
                
                <div className="border-t border-slate-100 dark:border-white/[0.05] pt-6">
                  <label className="label flex items-center gap-2 mb-4"><Receipt className="w-3.5 h-3.5" /> GST Configuration (Optional)</label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="ob_gstEnabled" name="gstEnabled" defaultChecked={false} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                      <label htmlFor="ob_gstEnabled" className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable GST on Receipts</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label text-xs">GST Number</label>
                        <input name="gstNumber" className="input" placeholder="22AAAAA..." />
                      </div>
                      <div>
                        <label className="label text-xs">Default GST Rate (%)</label>
                        <input name="gstRate" type="number" min="0" max="100" className="input" defaultValue={18} placeholder="18" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button type="button" onClick={() => setStep(4)} className="btn-primary text-base px-6 py-2.5">
                  Next Step <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>

{/* Step 4: Launch */}
            <div className={`transition-all duration-500 ${step === 4 ? "block animate-in slide-in-from-right-4 fade-in" : "hidden"}`}>
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">You're All Set!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                  The CRM is configured and ready to go. You can always change these settings later in the Settings page.
                </p>
                <button type="submit" className="btn-primary w-full text-lg py-3.5 font-semibold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 border-transparent">
                  Launch Dashboard
                </button>
              </div>
              <div className="mt-4">
                <button type="button" onClick={() => setStep(3)} className="btn-ghost w-full">
                  Go Back
                </button>
              </div>
            </div>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
