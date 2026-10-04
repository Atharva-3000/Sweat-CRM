"use client";

import { useState, useTransition } from "react";
import { Mail, MessageCircle, Phone, PhoneCall, Send, ExternalLink, Loader2, MessageSquare } from "lucide-react";
import { Modal } from "./modal";
import { useApp, useToast } from "./providers";
import { logMessage, logCallOutcome } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { TEMPLATES, type TemplateCtx, type TemplateKey } from "@/lib/templates";

export type Contact = {
  name: string;
  phone: string;
  email?: string;
  refType: "member" | "lead" | "staff";
  refId: string;
};

type Mode = "whatsapp" | "sms" | "email" | "call";

/**
 * Call / WhatsApp / Email buttons. Everything is mocked: messages are logged
 * to the "Messages" sheet. WhatsApp and email also offer a real deep-link so
 * the demo can open the actual app with the prefilled text.
 */
export function ContactButtons({
  contact,
  ctx = {},
  template = "custom",
  size = "sm",
}: {
  contact: Contact;
  ctx?: Omit<TemplateCtx, "name" | "gymName">;
  template?: TemplateKey;
  size?: "sm" | "md";
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  const cls =
    size === "sm"
      ? "rounded-md p-1.5 transition hover:bg-slate-100"
      : "btn-secondary";
  return (
    <div className="inline-flex items-center gap-1">
      <button type="button" title="Call" className={`${cls} text-sky-600`} onClick={() => setMode("call")}>
        <Phone className="h-4 w-4" />
        {size === "md" && "Call"}
      </button>
      <button type="button" title="WhatsApp" className={`${cls} text-emerald-600`} onClick={() => setMode("whatsapp")}>
        <MessageCircle className="h-4 w-4" />
        {size === "md" && "WhatsApp"}
      </button>
      {size === "md" && (
        <button type="button" title="SMS" className={`${cls} text-violet-600`} onClick={() => setMode("sms")}>
          <MessageSquare className="h-4 w-4" />
          SMS
        </button>
      )}
      <button type="button" title="Email" className={`${cls} text-amber-600`} onClick={() => setMode("email")}>
        <Mail className="h-4 w-4" />
        {size === "md" && "Email"}
      </button>
      {mode && <ContactDialog mode={mode} onClose={() => setMode(null)} contact={contact} ctx={ctx} template={template} />}
    </div>
  );
}

function ContactDialog({
  mode,
  onClose,
  contact,
  ctx,
  template,
}: {
  mode: Mode;
  onClose: () => void;
  contact: Contact;
  ctx: Omit<TemplateCtx, "name" | "gymName">;
  template: TemplateKey;
}) {
  const app = useApp();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const fullCtx: TemplateCtx = { ...ctx, name: contact.name, gymName: app.gymName };
  const [tpl, setTpl] = useState<TemplateKey>(template);
  const [subject, setSubject] = useState(TEMPLATES[template].subject(fullCtx));
  const [body, setBody] = useState(TEMPLATES[template].body(fullCtx));

  const changeTemplate = (k: TemplateKey) => {
    setTpl(k);
    setSubject(TEMPLATES[k].subject(fullCtx));
    setBody(TEMPLATES[k].body(fullCtx));
  };

  const send = () =>
    startTransition(async () => {
      const res = await logMessage({
        channel: mode,
        to: mode === "email" ? contact.email ?? "" : contact.phone,
        recipientName: contact.name,
        refType: contact.refType,
        refId: contact.refId,
        subject: mode === "email" ? subject : "",
        body: mode === "call" ? "Outgoing call" : body,
      });
      if (res.ok) {
        toast(res.message ?? "Done");
        onClose();
      } else toast(res.error, "error");
    });

  const intlPhone = `${app.countryCode}${contact.phone}`;
  const title = { whatsapp: "WhatsApp", sms: "SMS", email: "Email", call: "Call" }[mode];

  if (mode === "call") {
    return (
      <Modal open onClose={onClose} title={`Call ${contact.name}`} size="sm">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-100 dark:border-white/[0.05]">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
               <PhoneCall className="h-6 w-6 animate-pulse" />
             </div>
             <div>
               <p className="font-semibold text-slate-900 dark:text-white">{contact.name}</p>
               <a href={`tel:+${intlPhone}`} className="font-mono text-sm text-indigo-600 dark:text-indigo-400 hover:underline">+{app.countryCode} {contact.phone}</a>
             </div>
          </div>
          
          <ActionForm action={logCallOutcome} onSuccess={onClose}>
             <input type="hidden" name="memberId" value={contact.refId} />
             
             <div className="space-y-4">
               <div>
                 <label className="label">Call Outcome</label>
                 <select name="outcome" className="input" required>
                    <option value="">-- Select Outcome --</option>
                    <option value="will_pay">Will pay later (Follow-up in 3 days)</option>
                    <option value="no_answer">Did not pick up (Follow-up tomorrow)</option>
                    <option value="freeze">Wants to freeze membership</option>
                    <option value="cancel">Not renewing</option>
                    <option value="other">Other (Follow-up in 7 days)</option>
                 </select>
               </div>
               
               <div>
                 <label className="label">Notes (Optional)</label>
                 <textarea name="notes" className="input text-sm" placeholder="Any specific details..."></textarea>
               </div>
               
               <div className="flex gap-2 pt-2">
                 <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
                 <SubmitButton className="btn-primary flex-1">Log Outcome</SubmitButton>
               </div>
             </div>
          </ActionForm>
        </div>
      </Modal>
    );
  }

  if (mode === "email" && !contact.email) {
    return (
      <Modal open onClose={onClose} title="Email" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-300">No email address on file for {contact.name}. Edit the profile to add one.</p>
      </Modal>
    );
  }

  if (mode === "whatsapp") {
    return (
      <Modal open onClose={onClose} title={`WhatsApp ${contact.name}`} size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-white/[0.02] px-3 py-2 text-sm border border-slate-100 dark:border-white/[0.05]">
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            <span className="font-mono text-slate-700 dark:text-slate-300">+{intlPhone}</span>
          </div>
          <div>
            <label className="label">Template</label>
            <select className="input" value={tpl} onChange={(e) => changeTemplate(e.target.value as TemplateKey)}>
              {(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => (
                <option key={k} value={k}>
                  {TEMPLATES[k].label}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-100 whitespace-pre-wrap border border-emerald-100 dark:border-emerald-500/20">
            {body}
          </div>
          <div className="flex gap-2 pt-2">
            <button className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <a 
              className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white border-transparent" 
              target="_blank" 
              rel="noreferrer" 
              href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(body)}`}
              onClick={() => {
                send(); // optionally log the message when they open WA
              }}
            >
              <Send className="h-4 w-4" /> Open WhatsApp
            </a>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={`${title} · ${contact.name}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-white/[0.02] px-3 py-2 text-sm border border-slate-100 dark:border-white/[0.05]">
          <span className="text-slate-500 dark:text-slate-400">To</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">{mode === "email" ? contact.email : `+${app.countryCode} ${contact.phone}`}</span>
        </div>
        <div>
          <label className="label">Template</label>
          <select className="input" value={tpl} onChange={(e) => changeTemplate(e.target.value as TemplateKey)}>
            {(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => (
              <option key={k} value={k}>
                {TEMPLATES[k].label}
              </option>
            ))}
          </select>
        </div>
        {mode === "email" && (
          <div>
            <label className="label">Subject</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Message</label>
          <textarea className="input min-h-44 font-[inherit]" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-white/[0.05] pt-4">
          {mode === "email" ? (
            <a className="btn-ghost text-xs" href={`mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
              <ExternalLink className="h-3.5 w-3.5" /> Open mail app
            </a>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={send} disabled={pending || !body.trim()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send (mock)
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
