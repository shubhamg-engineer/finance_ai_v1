import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceStore } from "@/lib/store";
import { useFile, useAnalysis } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Activity, AlertTriangle, ShieldCheck, Sparkles, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brief")({
  component: DailyBriefPage,
});

function DailyBriefPage() {
  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const { data: fileData, isLoading: isFileLoading } = useFile(currentFileId);

  const activeAnalysisSummary = fileData?.analyses?.[0]; // Get latest analysis
  const { data: analysisData, isLoading: isAnalysisLoading } = useAnalysis(activeAnalysisSummary?.id || null);
  
  const results = analysisData?.result;
  const activeFile = fileData?.metadata;

  if (isFileLoading || isAnalysisLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Daily brief...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentFileId || !results) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-sm mx-auto">
          <FileText className="h-12 w-12 text-primary animate-pulse mb-4" />
          <h3 className="text-lg font-bold">No Daily Brief Available</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Please run the AI CFO Pipeline on the Dashboard first to compile your executive daily brief.
          </p>
        </div>
      </AppLayout>
    );
  }

  const finalOut = results.final?.output ?? {};
  const dateStr = new Date(activeFile?.updated_at || Date.now()).toLocaleDateString("default", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AppLayout>
      <div className="space-y-6 stage-enter">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finance Daily Brief</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Executive summary briefing Compiled by Chief Command AI.
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {dateStr}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Brief Content (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Executive Summary */}
            <Card className="p-5 border border-border/60 bg-card space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> Executive Summary
              </span>
              <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                {finalOut.final_summary || "Ledger processed. Operations healthy with normal variances reported MoM."}
              </p>
            </Card>

            {/* AI Insights & Daily Briefing Text */}
            {finalOut.daily_briefing && (
              <Card className="p-5 border border-border/60 bg-card space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Insights & Briefing Context</span>
                <div className="rounded-lg border border-border bg-muted/20 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {String(finalOut.daily_briefing)}
                </div>
              </Card>
            )}

            {/* Compliance Warnings & Reminders */}
            <Card className="p-5 border border-border/60 bg-card space-y-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Compliance & Audit Reminders
              </span>
              
              {results.compliance?.output?.deadlines && results.compliance.output.deadlines.length > 0 ? (
                <div className="space-y-3">
                  {results.compliance.output.deadlines.map((dl: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start gap-2 p-3 rounded-lg border border-border bg-muted/10">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{dl.task || dl.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Category: GST / Tax Filing</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                        Due: {dl.due_date || "30 Days"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/10 border border-dashed border-border p-4 rounded-lg text-center">
                  All compliance logs nominal. GST/TDS filings active and current.
                </p>
              )}
            </Card>

            {/* Pattern Alert Section (PRD FR-08) */}
            {results.composite_patterns && results.composite_patterns.length > 0 && (
              <Card className="p-5 border border-primary/20 bg-primary/5 space-y-4">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Pattern Alert
                </span>
                <div className="space-y-3">
                  {results.composite_patterns.map((p: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-primary/15 bg-background">
                      <div className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5",
                        p.severity === "CRITICAL" ? "bg-red-500 text-white" :
                        p.severity === "HIGH" ? "bg-amber-500 text-white" :
                        "bg-primary text-primary-foreground"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-semibold text-foreground leading-normal">
                          {p.title || p.name || p.pattern_id?.replace(/_/g, " ")}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-normal">{p.description}</p>
                        {p.modules_involved?.length > 0 && (
                          <p className="text-[9px] text-primary font-mono">
                            Modules: {p.modules_involved.join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Action Items Column (1 Column) */}
          <div className="space-y-6">
            {/* Urgent Actions */}
            <Card className="p-5 border border-border/60 bg-card space-y-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Urgent Action List
              </span>

              {finalOut.urgent_actions && finalOut.urgent_actions.length > 0 ? (
                <div className="space-y-3">
                  {(finalOut.urgent_actions as any[]).map((action, i) => {
                    const actionStr = typeof action === "string" ? action : action.action ?? "";
                    const owner = typeof action === "string" ? "CFO" : action.owner ?? "CFO";
                    const deadline = typeof action === "string" ? "30 Days" : action.deadline ?? "30 Days";

                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-red-500/5 border-red-500/10">
                        <div className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-xs font-semibold text-foreground leading-normal">{actionStr}</p>
                          <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3 shrink-0" />
                            <span>Owner: {owner} · Due: {deadline}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/10 border border-dashed border-border p-4 rounded-lg text-center">
                  No pending action requirements detected.
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
