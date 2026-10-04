import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton, ModalForm } from "@/components/action-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { saveSettings, sendTestEmail } from "@/app/actions";
import { settingsOf } from "@/lib/queries";
import { LoginEmailSetup } from "@/components/login-email-setup";

export default async function SettingsPage() {
  await requireAdmin();
  const db = await getDb();
  const s = settingsOf(db);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Gym Settings" subtitle="Global configuration" />
      
      <Card>
         <ActionForm action={saveSettings} className="space-y-6">
            <div className="space-y-4">
               <h3 className="font-medium text-lg border-b border-slate-100 pb-2">General</h3>
               
               <div>
                 <label className="label">Gym Name</label>
                 <input name="gymName" required className="input" defaultValue={s.gymName} />
               </div>

               <div>
                 <label className="label">GST Number (For Receipts)</label>
                 <input name="gstNumber" className="input" defaultValue={s.gstNumber} placeholder="22AAAAA0000A1Z5" />
               </div>
               
               <div>
                 <label className="label">Country Code (For WhatsApp SMS)</label>
                 <input name="countryCode" required className="input" defaultValue={s.countryCode} placeholder="e.g. 91" />
                 <p className="text-xs text-slate-500 mt-1">Include country code without + to enable WhatsApp links.</p>
               </div>
            </div>

            <div className="space-y-4 pt-4">
               <h3 className="font-medium text-lg border-b border-slate-100 dark:border-white/[0.08] pb-2">Appearance</h3>
               <div>
                 <label className="label">Theme Preference</label>
                 <ThemeToggle />
               </div>
            </div>

            <div className="space-y-4 pt-4">
               <h3 className="font-medium text-lg border-b border-slate-100 dark:border-white/[0.08] pb-2">Billing & GST</h3>
               
               <div className="flex items-center gap-2">
                 <input type="checkbox" id="gstEnabled" name="gstEnabled" defaultChecked={s.gstEnabled} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600" />
                 <label htmlFor="gstEnabled" className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable GST on Receipts</label>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="label">GST Number</label>
                   <input name="gstNumber" className="input" defaultValue={s.gstNumber} placeholder="22AAAAA..." />
                 </div>
                 <div>
                   <label className="label">Default GST Rate (%)</label>
                   <input name="gstRate" type="number" min="0" max="100" className="input" defaultValue={s.gstRate} placeholder="18" />
                 </div>
               </div>
               
               <div>
                 <label className="label">SAC Code (Services Accounting Code)</label>
                 <input name="sacCode" className="input" defaultValue={s.sacCode} placeholder="999723" />
                 <p className="text-xs text-slate-500 mt-1">Standard fitness center SAC is typically 999723. Confirm with your CA.</p>
               </div>
            </div>

            <div className="space-y-4 pt-4">
               <h3 className="font-medium text-lg border-b border-slate-100 dark:border-white/[0.08] pb-2">Admin Security</h3>
               <LoginEmailSetup defaultEmail={s.ownerLoginEmail || ""} />
            </div>

            <div className="space-y-4 pt-4">
               <h3 className="font-medium text-lg border-b border-slate-100 dark:border-white/[0.08] pb-2">Database Connection</h3>
               
               <div>
                 <label className="label">Provider</label>
                 <select name="dbProvider" className="input" defaultValue={s.dbProvider}>
                    <option value="local">Local Excel File (data/gym-db.xlsx)</option>
                    <option value="google">Google Sheets</option>
                 </select>
               </div>

               <div>
                 <label className="label">Google Sheet ID</label>
                 <input type="text" name="googleSheetId" className="input" defaultValue={s.googleSheetId} placeholder="1BxiMVs0XRY..." />
                 <p className="text-xs text-slate-500 mt-1">Required only if using Google Sheets. Make sure the service account has edit access.</p>
               </div>
            </div>

            <div className="space-y-4 pt-4">
               <h3 className="font-medium text-lg border-b border-slate-100 dark:border-white/[0.08] pb-2">Reminders & Alerts</h3>
               
               <div>
                 <label className="label">Renewal Reminder (Days)</label>
                 <input type="number" name="reminderDays" required min="1" className="input" defaultValue={s.reminderDays} />
                 <p className="text-xs text-slate-500 mt-1">Show "Expiring Soon" warning this many days before expiry.</p>
               </div>
            </div>

            <div className="pt-4 flex justify-end items-center border-t border-slate-100 dark:border-white/[0.08]">
               <SubmitButton className="btn-primary mt-4">Save Settings</SubmitButton>
            </div>
         </ActionForm>
      </Card>

      <Card>
         <div className="space-y-4">
            <h3 className="font-medium text-lg border-b border-slate-100 dark:border-white/[0.08] pb-2">Email Integration</h3>
            <ActionForm action={saveSettings}>
               <div className="space-y-4">
                 <div>
                   <label className="label">Sender Email Address</label>
                   <input type="email" name="senderEmail" className="input" defaultValue={s.senderEmail} placeholder="hello@cloverstudio.art" />
                   <p className="text-xs text-slate-500 mt-1">The email address your CRM emails will be sent from. Must be verified in Resend.</p>
                 </div>
                 <div className="flex justify-end">
                    <SubmitButton className="btn-primary">Save Sender Email</SubmitButton>
                 </div>
               </div>
            </ActionForm>
         </div>

         <div className="mt-8 space-y-4 pt-4 border-t border-slate-100 dark:border-white/[0.08]">
            <h3 className="font-medium text-lg pb-2">Test Your Setup</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Verify your Resend domain configuration by sending a quick test email to your inbox.</p>
              <ModalForm trigger="Send Test Email" title="Send Test Email" action={sendTestEmail} triggerClassName="btn-secondary" submitLabel="Send">
                 <div className="space-y-4">
                   <p className="text-sm text-slate-500">Send a quick test email to verify your Resend domain configuration.</p>
                   <div>
                     <label className="label">Send to</label>
                     <input type="email" name="testEmail" required className="input" placeholder="you@example.com" />
                   </div>
                 </div>
              </ModalForm>
            </div>
         </div>
      </Card>
    </div>
  );
}
