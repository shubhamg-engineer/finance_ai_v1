import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useFinanceStore } from "@/lib/store";
import { api } from "@/lib/api";
import { SAMPLE_TRANSACTIONS } from "@/lib/sample-data";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Toaster, toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Finance AI Chief Command · CFO Dashboard" },
      {
        name: "description",
        content:
          "Secure multi-agent AI CFO sandbox. Upload transactions and review automated financial health ratings and forecast insights.",
      },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();
  const setCurrentFileId = useFinanceStore((s) => s.setCurrentFileId);
  const currentFileId = useFinanceStore((s) => s.currentFileId);

  useEffect(() => {
    let active = true;

    async function initialize() {
      // Already have a file in store → go straight to dashboard
      if (currentFileId) {
        if (active) navigate({ to: "/dashboard" });
        return;
      }

      // Try to connect backend; any failure = skip to dashboard in demo mode
      try {
        const files = await api.getFiles();

        if (files && files.length > 0) {
          if (active) {
            setCurrentFileId(files[0].id);
            navigate({ to: "/dashboard" });
          }
          return;
        }

        // No files yet — seed sample ledger silently
        const headers = ["Date", "Type", "Amount", "Category", "Description"];
        const rows = SAMPLE_TRANSACTIONS.map(
          (t) =>
            `"${t.date}","${t.type}",${t.amount},"${t.category || ""}","${t.description || ""}"`
        );
        const csvContent = [headers.join(","), ...rows].join("\n");
        const mockFile = new File(
          [csvContent],
          "Aghron_Sample_Financials_2026.csv",
          { type: "text/csv" }
        );

        const res = await api.uploadFile(mockFile);
        if (active) setCurrentFileId(res.file_id);

        // Fire pipeline in background — non-blocking
        api.runPipeline(res.file_id).catch(() => {});

        if (active) {
          toast.success("AI CFO Workspace initialized with Aghron sample financials.");
          navigate({ to: "/dashboard" });
        }
      } catch {
        // Backend unavailable → open dashboard immediately in demo mode
        if (active) navigate({ to: "/dashboard" });
      }
    }

    initialize();
    return () => {
      active = false;
    };
  }, [currentFileId, setCurrentFileId, navigate]);

  // Show a brief loading splash while redirecting
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground items-center justify-center p-6 relative overflow-hidden">
      <Toaster richColors position="top-right" />

      {/* Ambient glass orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-violet-600 text-white shadow-xl shadow-primary/20 animate-pulse">
            <BrainCircuit className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Finance AI</h1>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Chief Command
            </p>
          </div>
        </div>

        <Card className="p-6 border border-border/80 flex flex-col items-center space-y-4 bg-card/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">
            Launching CFO Command Center...
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Orchestrating compliance, treasury, accounting &amp; planning agents.
          </p>
        </Card>
      </div>
    </div>
  );
}
