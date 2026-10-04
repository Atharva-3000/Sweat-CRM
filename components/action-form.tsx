"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "./providers";
import { Modal } from "./modal";
import type { ActionResult } from "@/lib/types";

type Action = (fd: FormData) => Promise<ActionResult>;

export function SubmitButton({ children, className = "btn-primary" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/** A <form> bound to a server action that shows a toast with the result. */
export function ActionForm({
  action,
  children,
  className,
  onSuccess,
  confirm,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  onSuccess?: () => void;
  confirm?: string;
}) {
  const toast = useToast();
  const router = useRouter();
  return (
    <form
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      action={async (fd) => {
        const res = await action(fd);
        if (!res.ok) {
          toast(res.error, "error");
          return;
        }
        if (res.message) toast(res.message);
        onSuccess?.();
        if (res.redirectTo) router.push(res.redirectTo);
      }}
    >
      {children}
    </form>
  );
}

/** A single button that triggers a server action (with hidden fields). */
export function ActionButton({
  action,
  fields,
  children,
  className = "btn-secondary btn-sm",
  confirm,
}: {
  action: Action;
  fields: Record<string, string>;
  children: ReactNode;
  className?: string;
  confirm?: string;
}) {
  return (
    <ActionForm action={action} confirm={confirm} className="inline">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton className={className}>{children}</SubmitButton>
    </ActionForm>
  );
}

/** A trigger button that opens a modal containing a server-action form. */
export function ModalForm({
  trigger,
  triggerClassName = "btn-primary",
  title,
  action,
  children,
  submitLabel = "Save",
  size = "md",
}: {
  trigger: ReactNode;
  triggerClassName?: string;
  title: string;
  action: Action;
  children: ReactNode;
  submitLabel?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} size={size}>
        <ActionForm action={action} onSuccess={() => setOpen(false)} className="space-y-4">
          {children}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}

/** <select> that submits its form as soon as the value changes. */
export function AutoSubmitSelect({
  action,
  name,
  value,
  options,
  hidden,
  className = "input py-1 text-xs",
}: {
  action: Action;
  name: string;
  value: string;
  options: readonly string[];
  hidden: Record<string, string>;
  className?: string;
}) {
  return (
    <ActionForm action={action}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <select name={name} defaultValue={value} className={className} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </ActionForm>
  );
}
