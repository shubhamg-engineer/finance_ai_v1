import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceStore } from "@/lib/store";
import { useFile, useAnalysis } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Activity, ShieldCheck, Zap, AlertTriangle, HelpCircle, CheckCircle2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/signals")({
  component: SignalsPage,
});

const SEVERITY_CONFIG = {
  CRITICAL: {
    icon: AlertTriangle,
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
    border: "border-red-500/20 bg-red-500/5",
    dot: "bg-red-500",
  },
  HIGH: {
    icon: AlertTriangle,
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    border: "border-amber-500/20 bg-amber-500/5",
    dot: "bg-amber-500",
  },
  WARNING: {
    icon: HelpCircle,
    badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    border: "border-yellow-500/20 bg-yellow-500/5",
    dot: "bg-yellow-400",
  },
};

// Map pattern IDs to full human-readable names (PRD EF-01)
const PATTERN_NAMES: Record<string, string> = {
  FUNDRAISING_RISK_COMPOSITE: "Fundraising Risk Composite",
  CASH_CRUNCH_IMMINENT: "Cash Crunch Imminent",
  COMPLIANCE_OPERATIONAL_RISK: "Compliance & Operational Risk",
  FRAUD_CONTROL_BREAKDOWN: "Fraud Control Breakdown",
  BOARD_NARRATIVE_RISK: "Board Narrative Risk",
  GROWTH_EFFICIENCY_DETERIORATION: "Growth Efficiency Deterioration",
};

// Map pattern IDs to modules involved
const PATTERN_MODULES: Record<string, string[]> = {
  FUNDRAISING_RISK_COMPOSITE: ["Planning AI", "Treasury AI", "Research AI"],
  CASH_CRUNCH_IMMINENT: ["Treasury AI", "Accounting AI", "Planning AI"],
  COMPLIANCE_OPERATIONAL_RISK: ["Compliance AI", "Accounting AI"],
  FRAUD_CONTROL_BREAKDOWN: ["Accounting AI", "Planning AI"],
  BOARD_NARRATIVE_RISK: ["Reporting AI", "Planning AI", "Treasury AI"],
  GROWTH_EFFICIENCY_DETERIORATION: ["Research AI", "Planning AI", "Reporting AI"],
};

function SignalsPage() {
  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const { data: fileData, isLoading: isFileLoading } = useFile(currentFileId);

  const activeAnalysisSummary = fileData?.analyses?.[0];
  const { data: analysisData, isLoading: isAnalysisLoading } = useAnalysis(activeAnalysisSummary?.id || null);

  const results = analysisData?.result;
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const handleAcknowledge = (patternId: string) => {
    setAcknowledged((prev) => {
      const next = new Set(prev);
      next.add(patternId);
      return next;
    });
    toast.success("Signal acknowledged. It will be suppressed for 24 hours.", { duration: 3000 });
  };

  if (isFileLoading || isAnalysisLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Signals...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentFileId || !results) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-sm mx-auto">
          <Bell className="h-12 w-12 text-primary animate-pulse mb-4" />
          <h3 className="text-lg font-bold">No Active Signals</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Please run the AI CFO Pipeline on the Dashboard first to capture composite risk pattern alerts.
          </p>
        </div>
      </AppLayout>
    );
  }

  const patterns = results.composite_patterns ?? [];
  const activePatterns = patterns.filter((p) => !acknowledged.has(p.pattern_id));
  const ackedPatterns = patterns.filter((p) => acknowledged.has(p.pattern_id));

  return (
    <AppLayout>
      <Toaster position="top-right" richColors />
      <div className="space-y-6 stage-enter">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Active Signals</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Reconciled cross-module risk patterns and composite compliance alert warnings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-border/60 text-[10px] font-mono">
              {activePatterns.length} Active · {ackedPatterns.length} Acknowledged
            </Badge>
          </div>
        </div>

        {activePatterns.length === 0 && ackedPatterns.length === 0 ? (
          <Card className="p-8 text-center max-w-md mx-auto border border-dashed border-border bg-card">
            <ShieldCheck className="h-12 w-12 text-emerald-500 animate-pulse mx-auto mb-4" />
            <h3 className="text-lg font-bold">All Systems Nominal</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              No active cross-module risk signals or compliance alerts detected. Your financials align with healthy corporate bounds.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activePatterns.map((p) => {
              const severity = (p.severity || "WARNING").toUpperCase();
              const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.WARNING;
              const Icon = config.icon;
              const fullName = PATTERN_NAMES[p.pattern_id] || (p.title || p.name || p.pattern_id);
              const modulesInvolved = p.modules_involved?.length
                ? p.modules_involved
                : PATTERN_MODULES[p.pattern_id] || [];

              return (
                <Card key={p.pattern_id} className={cn("p-5 border rounded-xl", config.border)}>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                    {/* Left: Icon + Content */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-background border flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-current" />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{fullName}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border leading-none tracking-wide", config.badge)}>
                            {severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal">{p.description}</p>
                        {/* Modules Involved */}
                        {modulesInvolved.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {modulesInvolved.map((mod) => (
                              <span
                                key={mod}
                                className="inline-flex items-center gap-1 rounded border border-border/60 bg-background/80 px-1.5 py-0.5 text-[9px] font-semibold font-mono text-muted-foreground"
                              >
                                <Zap className="h-2.5 w-2.5 text-primary" />
                                {mod}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Recommended Action */}
                        {p.recommended_action && (
                          <div className="mt-2 border-l-2 border-primary/40 pl-3 text-[10px] text-muted-foreground leading-relaxed bg-primary/5 py-1.5 rounded-r-md">
                            <span className="font-semibold text-foreground">Recommended:</span> {p.recommended_action}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(p.pattern_id)}
                        className="h-7 px-3 text-[10px] font-semibold gap-1.5 border-border/60 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 w-full sm:w-auto"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Acknowledge
                      </Button>
                      <Badge variant="outline" className="text-[9px] bg-background border-border/80 uppercase font-mono">
                        Cross-Module Pattern
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Acknowledged section */}
            {ackedPatterns.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Acknowledged (suppressed 24h)
                </p>
                {ackedPatterns.map((p) => (
                  <Card key={p.pattern_id} className="p-4 border border-border/40 bg-muted/10 opacity-60">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold text-muted-foreground truncate">
                          {PATTERN_NAMES[p.pattern_id] || p.title || p.pattern_id}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">Acknowledged</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
