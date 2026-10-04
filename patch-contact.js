const fs = require('fs');
let code = fs.readFileSync('components/contact-buttons.tsx', 'utf8');

// Need to import ActionForm, logCallOutcome 
if (!code.includes('logCallOutcome')) {
  code = code.replace(
    'import { logMessage } from "@/app/actions";',
    'import { logMessage, logCallOutcome } from "@/app/actions";\nimport { ActionForm, SubmitButton } from "@/components/action-form";'
  );
}

// Replace the mode === "call" block
const blockRegex = /if \(mode === "call"\) \{[\s\S]*?return \([\s\S]*?<\/Modal>\s*\);\s*\}/m;

const newCallBlock = `if (mode === "call") {
    return (
      <Modal open onClose={onClose} title={\`Call \${contact.name}\`} size="sm">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-100 dark:border-white/[0.05]">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
               <PhoneCall className="h-6 w-6 animate-pulse" />
             </div>
             <div>
               <p className="font-semibold text-slate-900 dark:text-white">{contact.name}</p>
               <a href={\`tel:+\${intlPhone}\`} className="font-mono text-sm text-indigo-600 dark:text-indigo-400 hover:underline">+\${app.countryCode} \${contact.phone}</a>
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
  }`;

code = code.replace(blockRegex, newCallBlock);
fs.writeFileSync('components/contact-buttons.tsx', code);
