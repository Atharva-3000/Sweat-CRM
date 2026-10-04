"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui";
import { parseImportFile, commitImport, type ParsedRow } from "@/app/actions-import";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers";
import { UploadCloud, Download, AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

export function ImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ParsedRow[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewData(null);
      setError("");
    }
  };

  const handleParse = async () => {
    if (!file) return;
    setError("");
    
    startTransition(async () => {
      try {
        const text = await file.text();
        const res = await parseImportFile(text);
        if (res.ok && res.rows) {
          setPreviewData(res.rows);
        } else {
          setError(res.error || "Failed to parse file.");
        }
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  const handleCommit = () => {
    if (!previewData) return;
    
    // Only import valid rows
    const validRows = previewData.filter(r => r.errors.length === 0).map(r => r.parsed);
    if (validRows.length === 0) {
      setError("No valid rows to import. Please fix errors in your CSV.");
      return;
    }
    
    startTransition(async () => {
      const res = await commitImport(validRows);
      if (res.ok) {
        toast(res.message || "Import successful");
        router.push("/members");
      } else {
        setError(res.message || "Failed to commit import.");
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {!previewData && (
        <Card className="p-8 text-center max-w-2xl mx-auto">
          <UploadCloud className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Upload your spreadsheet</h2>
          <p className="text-slate-500 mb-6 text-sm">
            We accept .csv files. For best results, please download our template and paste your data into it before uploading.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <a href="/api/template" download className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" /> Download CSV Template
            </a>
            <div className="relative">
              <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <button className="btn-primary flex items-center gap-2 pointer-events-none">
                Select CSV File
              </button>
            </div>
          </div>
          
          {file && (
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] p-4 rounded-lg flex items-center justify-between text-sm">
               <span className="font-medium text-slate-700 dark:text-slate-300">{file.name}</span>
               <button className="btn-primary py-1.5 px-4 text-xs" onClick={handleParse} disabled={isPending}>
                 {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Preview Data"}
               </button>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </Card>
      )}

      {previewData && (
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-lg font-bold">Import Preview</h3>
              <p className="text-sm text-slate-500">
                Found {previewData.length} total rows. 
                <span className="text-emerald-600 font-semibold ml-2">{previewData.filter(r => r.errors.length === 0).length} valid</span> / 
                <span className="text-red-600 font-semibold ml-2">{previewData.filter(r => r.errors.length > 0).length} errors</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => setPreviewData(null)}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleCommit} 
                disabled={isPending || previewData.filter(r => r.errors.length === 0).length === 0}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Import {previewData.filter(r => r.errors.length === 0).length} Valid Members
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Card className="overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-sm whitespace-nowrap relative">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-white/[0.05]">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Phone</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Plan Mapping</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Start Date</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">End Date</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Opening Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {previewData.map((row) => {
                    const isValid = row.errors.length === 0;
                    return (
                      <tr key={row.id} className={!isValid ? "bg-red-50/50 dark:bg-red-500/5" : ""}>
                        <td className="px-4 py-3">
                          {isValid ? (
                            <div className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4"/> Ready</div>
                          ) : (
                            <div className="flex flex-col gap-1 text-red-600">
                              <div className="flex items-center gap-1 font-semibold"><XCircle className="w-4 h-4"/> Error</div>
                              <span className="text-[10px] whitespace-normal break-words max-w-[150px]">{row.errors.join(", ")}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{row.parsed.name || <span className="text-slate-400 italic">Empty</span>}</td>
                        <td className="px-4 py-3 font-mono">{row.parsed.phone || <span className="text-slate-400 italic">Empty</span>}</td>
                        <td className="px-4 py-3">
                           {row.parsed.planId ? (
                             <span className="text-emerald-600 font-medium">{row.parsed.planNameStr}</span>
                           ) : (
                             <span className="text-red-500">{row.parsed.planNameStr || "None"}</span>
                           )}
                        </td>
                        <td className="px-4 py-3">{row.parsed.startDate}</td>
                        <td className="px-4 py-3">{row.parsed.endDate}</td>
                        <td className="px-4 py-3 font-medium">₹{row.parsed.balanceDue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4 flex gap-3 text-amber-800 dark:text-amber-200 text-sm">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <p>Only rows marked as <strong className="font-semibold text-emerald-600 dark:text-emerald-400">Ready</strong> will be imported. Rows with errors will be skipped. You can import the valid rows now, fix the skipped ones in Excel, and do a second upload!</p>
          </div>
        </div>
      )}
    </div>
  );
}
