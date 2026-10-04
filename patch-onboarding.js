const fs = require('fs');
let code = fs.readFileSync('components/onboarding.tsx', 'utf8');

// I need to add FileText or Receipt icon to lucide imports
if (!code.includes('Receipt')) {
  code = code.replace(
    'Settings2,',
    'Settings2,\n  Receipt,'
  );
}

const newStep3 = `            {/* Step 3: Localization & GST */}
            <div className={\`transition-all duration-500 \${step === 3 ? "block animate-in slide-in-from-right-4 fade-in" : "hidden"}\`}>
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
            </div>`;

code = code.replace(/\{\/\* Step 3: Localization & Theme \*\/\}[\s\S]*?(?=\{\/\* Step 4: Launch \*\/)/, newStep3 + '\n\n');

// Then change Step 4: Launch to Step 4: Theme, Step 5: Launch? Or just put Theme inside Step 4.
// Let's just put Theme inside Step 4. 
// Actually, it's easier to just modify Step 4. But wait, I've replaced Step 3 and completely deleted the Theme selection? Yes, I did. Let's re-add Theme to Step 3.

const newStep3WithTheme = `            {/* Step 3: Localization & Billing */}
            <div className={\`transition-all duration-500 \${step === 3 ? "block animate-in slide-in-from-right-4 fade-in" : "hidden"}\`}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Localization & Billing</h2>
                <p className="text-slate-500 dark:text-slate-400">Set your region and optional GST settings.</p>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Country Code</label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-lg font-mono">+</span>
                      <input name="countryCode" type="number" required defaultValue={defaultCountryCode} className="input text-lg py-3 font-mono" placeholder="91" />
                    </div>
                  </div>
                  <div>
                    <label className="label flex items-center gap-2"><Settings2 className="w-3.5 h-3.5" /> App Theme</label>
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={() => setTheme("light")} className={\`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all \${mounted && theme !== "dark" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600"}\`}>
                        <Sun className="w-4 h-4" /> Light
                      </button>
                      <button type="button" onClick={() => setTheme("dark")} className={\`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all \${mounted && theme === "dark" ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#18181b] text-slate-600 dark:text-slate-400"}\`}>
                        <Moon className="w-4 h-4" /> Dark
                      </button>
                    </div>
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
                  Final Step <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>`;

code = code.replace(/\{\/\* Step 3: Localization & Theme \*\/\}[\s\S]*?(?=\{\/\* Step 4: Launch \*\/)/, newStep3WithTheme + '\n\n');

fs.writeFileSync('components/onboarding.tsx', code);
