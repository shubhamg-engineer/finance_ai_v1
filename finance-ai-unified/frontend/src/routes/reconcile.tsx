import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { apiExt, useReconciliations, ReconciliationResult } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Upload, CheckCircle2, XCircle, AlertTriangle, BarChart2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/reconcile")({ component: ReconcilePage });

function ReconcilePage() {
  const { data: history } = useReconciliations();
  const qc = useQueryClient();
  const bankRef = useRef<HTMLInputElement>(null);
  const ledgerRef = useRef<HTMLInputElement>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [tab, setTab] = useState<"matched" | "bank" | "ledger">("matched");

  const handleRun = async () => {
    if (!bankFile || !ledgerFile) { toast.error("Please select both files"); return; }
    setRunning(true);
    try {
      const res = await apiExt.reconcile(bankFile, ledgerFile);
      setResult(res);
      toast.success(`Reconciliation complete: ${res.matched}/${res.total_bank} matched (${res.match_rate_pct}%)`);
      qc.invalidateQueries({ queryKey: ["reconciliations"] });
    } catch (e: any) {
      toast.error(e.message || "Reconciliation failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <AppLayout>
      <Toaster richColors position="top-right" />
      <div className="space-y-6 stage-enter">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank Reconciliation Engine</h1>
          <p className="text-xs text-muted-foreground mt-1">Upload bank statement + ledger CSV · AI fuzzy matching · Instant reconciliation report</p>
        </div>

        {/* Upload Zone */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Bank Statement (CSV)", ref: bankRef, file: bankFile, setter: setBankFile, color: "border-blue-500/30 bg-blue-500/5" },
            { label: "Internal Ledger (CSV)", ref: ledgerRef, file: ledgerFile, setter: setLedgerFile, color: "border-violet-500/30 bg-violet-500/5" },
          ].map(({ label, ref, file, setter, color }) => (
            <Card key={label} className={cn("p-5 border-2 border-dashed transition-all cursor-pointer text-center space-y-3", color, file && "border-solid border-emerald-500/50 bg-emerald-500/5")}
              onClick={() => (ref as any).current?.click()}>
              <input type="file" ref={ref} accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && setter(e.target.files[0])} />
              {file
                ? <><CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" /><p className="text-xs font-semibold">{file.name}</p><p className="text-[10px] text-emerald-500">Ready</p></>
                : <><Upload className="h-8 w-8 text-muted-foreground/50 mx-auto" /><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="text-[10px] text-muted-foreground">Click to upload CSV</p></>
              }
            </Card>
          ))}
        </div>

        <Button onClick={handleRun} disabled={running || !bankFile || !ledgerFile} className="w-full">
          <RefreshCw className={cn("h-4 w-4 mr-2", running && "animate-spin")} />
          {running ? "Running Reconciliation..." : "Run AI Reconciliation"}
        </Button>

        {/* Live Result */}
        {result && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Bank Transactions", val: result.total_bank, color: "text-foreground" },
                { label: "Ledger Transactions", val: result.total_ledger, color: "text-foreground" },
                { label: "Matched", val: result.matched, color: "text-emerald-500" },
                { label: "Unmatched Bank", val: result.unmatched_bank, color: "text-red-500" },
                { label: "Match Rate", val: `${result.match_rate_pct}%`, color: result.match_rate_pct >= 90 ? "text-emerald-500" : result.match_rate_pct >= 70 ? "text-amber-500" : "text-red-500" },
              ].map(k => (
                <Card key={k.label} className="p-4 border border-border/60 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
                  <p className={cn("text-2xl font-extrabold mt-1", k.color)}>{k.val}</p>
                </Card>
              ))}
            </div>

            {/* Match Rate Bar */}
            <Card className="p-4 border border-border/60">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold">Overall Match Rate</span>
                <span className="font-bold">{result.match_rate_pct}%</span>
              </div>
              <div className="h-3 rounded-full bg-border/40 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700"
                  style={{ width: `${result.match_rate_pct}%` }} />
              </div>
            </Card>

            {/* Tabs */}
            <Card className="p-5 border border-border/60 space-y-3">
              <div className="flex gap-2">
                {(["matched", "bank", "ledger"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} className={cn("text-[11px] px-3 py-1 rounded-full font-semibold border transition-all",
                    tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                    {t === "matched" ? `✓ Matched (${result.matched})` : t === "bank" ? `⚠ Unmatched Bank (${result.unmatched_bank})` : `⚠ Unmatched Ledger (${result.unmatched_ledger})`}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {tab === "matched" && result.matched_items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Bank: </span><span className="font-medium">{item.bank.date} · ₹{item.bank.amount?.toLocaleString("en-IN")} · {item.bank.category}</span></div>
                      <div><span className="text-muted-foreground">Ledger: </span><span className="font-medium">{item.ledger.date} · ₹{item.ledger.amount?.toLocaleString("en-IN")} · {item.ledger.category}</span></div>
                    </div>
                    <Badge className="text-[9px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600">{(item.match_score * 100).toFixed(0)}%</Badge>
                  </div>
                ))}
                {tab === "bank" && result.unmatched_bank_items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-red-500/20 bg-red-500/5 text-xs">
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span className="font-medium">{item.date} · ₹{item.amount?.toLocaleString("en-IN")} · {item.category}</span>
                    <Badge className="ml-auto text-[9px] border-red-500/20 bg-red-500/10 text-red-500">Unmatched</Badge>
                  </div>
                ))}
                {tab === "ledger" && result.unmatched_ledger_items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="font-medium">{item.date} · ₹{item.amount?.toLocaleString("en-IN")} · {item.category}</span>
                    <Badge className="ml-auto text-[9px] border-amber-500/20 bg-amber-500/10 text-amber-500">Ledger Only</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Past Reconciliations */}
        {history && history.length > 0 && (
          <Card className="p-5 border border-border/60 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Past Reconciliations</span>
            </div>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 text-xs">
                  <span className="font-medium flex-1">{h.name}</span>
                  <span className="text-muted-foreground">{h.total_bank} bank · {h.total_ledger} ledger</span>
                  <Badge className={cn("text-[9px] border", h.match_rate_pct >= 90 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20")}>
                    {h.match_rate_pct}% match
                  </Badge>
                  <span className="text-muted-foreground text-[10px]">{h.created_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
