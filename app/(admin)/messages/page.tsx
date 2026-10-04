import { Wrench, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-8 shadow-sm">
        <Wrench className="h-10 w-10 animate-pulse" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
        Feature in the Works
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
        We're currently building out the central messaging hub. Soon, you'll be able to manage all your SMS, WhatsApp, and email conversations directly from here.
      </p>
      <Link href="/dashboard" className="btn-primary py-3 px-6 text-base inline-flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </Link>
    </div>
  );
}
