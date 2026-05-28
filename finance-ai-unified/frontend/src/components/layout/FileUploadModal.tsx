import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFinanceStore } from "@/lib/store";
import { api, useRunPipeline } from "@/lib/api";
import { SAMPLE_TRANSACTIONS } from "@/lib/sample-data";
import { cleanRows, parseJsonFinancialData } from "@/lib/finance-utils";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload, FileText, FileSpreadsheet, FileJson, Sparkles, Loader2, Info, X
} from "lucide-react";

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORMAT_GUIDE = [
  { col: "Date", desc: "Transaction date (YYYY-MM-DD, DD/MM/YYYY, etc.)", required: true },
  { col: "Type", desc: '"Revenue" or "Expense" (also: Income, Sales, Debit, Credit)', required: true },
  { col: "Amount", desc: "Numeric amount (currency symbols ignored)", required: true },
  { col: "Category", desc: "Expense/revenue category", required: false },
];

export function FileUploadModal({ open, onOpenChange }: FileUploadModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyStatus, setBusyStatus] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const setCurrentFileId = useFinanceStore((s) => s.setCurrentFileId);
  const setCurrentAnalysisId = useFinanceStore((s) => s.setCurrentAnalysisId);
  
  const runMutation = useRunPipeline();

  const handleFileProcess = async (file: File) => {
    setBusy(true);
    setBusyStatus(`Parsing ${file.name}...`);
    try {
      let txns: any[] = [];
      let skipped = 0;
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        const text = await file.text();
        const parsed = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        const result = cleanRows(parsed.data);
        txns = result.txns;
        skipped = result.skipped;
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array", cellDates: true });
        const allRows: Record<string, unknown>[] = [];
        for (const sheetName of wb.SheetNames) {
          const sheet = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
          allRows.push(...rows);
        }
        const result = cleanRows(allRows);
        txns = result.txns;
        skipped = result.skipped;
      } else if (ext === "json") {
        const text = await file.text();
        const json = JSON.parse(text);
        txns = parseJsonFinancialData(json);
        skipped = 0;
      } else {
        toast.error("Unsupported file type. Please upload CSV, Excel (.xlsx/.xls), or JSON.");
        setBusy(false);
        return;
      }

      if (txns.length === 0) {
        toast.error("No valid transactions found. Make sure columns match Date, Type, and Amount.");
        setBusy(false);
        return;
      }

      setBusyStatus("Uploading ledger to AI CFO sandbox...");
      const uploadRes = await api.uploadFile(file);
      
      setCurrentFileId(uploadRes.file_id);
      
      setBusyStatus("Running 8-agent AI analysis pipeline...");
      try {
        const analysisRes = await api.runPipeline(uploadRes.file_id);
        if (analysisRes.analysis_id) {
          setCurrentAnalysisId(analysisRes.analysis_id);
        }
      } catch (pipelineErr) {
        console.error("Pipeline run error:", pipelineErr);
        toast.warning("File loaded, but the AI CFO pipeline encountered errors. You can re-run it from the dashboard.");
      }

      // Invalidate queries so dashboard/transactions reload
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["file", uploadRes.file_id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", uploadRes.file_id] });
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });

      if (skipped > 0) {
        toast.warning(`Loaded ${txns.length} records (${skipped} rows skipped due to missing columns).`);
      } else {
        toast.success(`Successfully loaded and analyzed ${txns.length} transactions from ${file.name}!`);
      }
      
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to process ledger file.");
    } finally {
      setBusy(false);
      setBusyStatus("");
    }
  };

  const handleLoadSample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    setBusyStatus("Generating simulated corporate ledger...");
    try {
      const headers = ["Date", "Type", "Amount", "Category", "Description"];
      const rows = SAMPLE_TRANSACTIONS.map(t => 
        `"${t.date}","${t.type}",${t.amount},"${t.category || ''}","${t.description || ''}"`
      );
      const csvContent = [headers.join(","), ...rows].join("\n");
      const mockFile = new File([csvContent], "Aghron_Sample_Financials_2026.csv", { type: "text/csv" });

      setBusyStatus("Uploading sample transactions...");
      const uploadRes = await api.uploadFile(mockFile);
      setCurrentFileId(uploadRes.file_id);
      
      setBusyStatus("Orchestrating 8-agent AI finance analysis...");
      const analysisRes = await api.runPipeline(uploadRes.file_id);
      if (analysisRes.analysis_id) {
        setCurrentAnalysisId(analysisRes.analysis_id);
      }

      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["file", uploadRes.file_id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", uploadRes.file_id] });
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });

      toast.success("Successfully loaded 35 high-fidelity simulated transactions (Nov 2025 - May 2026)!");
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load sample data: " + err.message);
    } finally {
      setBusy(false);
      setBusyStatus("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg border border-border/80 bg-card/95 backdrop-blur shadow-2xl p-6 stage-enter max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary shrink-0" />
            Upload Company Financials
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Feed your ledger into the AI Chief Command sandbox. It automatically extracts details, parses GST/payroll, runs scenarios, and updates your CFO command indicators.
          </DialogDescription>
        </DialogHeader>

        {busy ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">{busyStatus}</p>
              <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                Multi-agent CFO pipeline is reconciling cash balances, auditing for anomalies, and drafting the strategic board brief...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFileProcess(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 ${
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Click to upload ledger</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Drag & drop your transactions file. Supports CSV, Excel, or JSON.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-1">
                {[
                  { icon: FileText, label: "CSV" },
                  { icon: FileSpreadsheet, label: "Excel" },
                  { icon: FileJson, label: "JSON" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground border border-border"
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileProcess(f);
                e.target.value = "";
              }}
            />

            {/* Load Sample CTA */}
            <div
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer text-center"
              onClick={handleLoadSample}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary animate-pulse shrink-0" />
                <span className="text-xs font-bold text-primary">Preview with simulated corporate ledger</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 leading-normal max-w-sm">
                No corporate transaction data on hand? Load our high-fidelity sample data spanning Nov 2025 – May 2026 to see all 8 AI agents in full action instantly.
              </p>
            </div>

            {/* Format Guide */}
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <button
                type="button"
                className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowGuide((v) => !v)}
              >
                <span className="flex items-center gap-1.5">
                  <Info className="h-4 w-4 shrink-0" />
                  Expected Columns / Formats
                </span>
                <span className="text-[10px] font-mono">{showGuide ? "COLLAPSE" : "EXPAND"}</span>
              </button>

              {showGuide && (
                <div className="mt-3 space-y-2 stage-enter">
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Headers are case-insensitive and mapped automatically. We look for:
                  </p>
                  <div className="grid gap-1.5">
                    {FORMAT_GUIDE.map((row) => (
                      <div key={row.col} className="flex items-start gap-2 rounded bg-background p-1.5 border border-border text-[10px]">
                        <div className="flex items-center gap-1 min-w-[75px] shrink-0">
                          <code className="font-mono text-primary font-semibold">{row.col}</code>
                        </div>
                        <p className="text-muted-foreground font-medium">{row.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
