import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceStore } from "@/lib/store";
import { useFile, useAnalysis } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Workflow,
  Play,
  Activity,
  CalendarRange,
  Flame,
  AlertOctagon,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Clock,
  History,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workflows")({
  component: WorkflowsPage,
});

interface WorkflowDef {
  id: string;
  name: string;
  trigger: string;
  description: string;
  icon: any;
  iconColor: string;
  steps: string[];
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "completed" | "failed";
  trigger: string;
  resultSummary: string;
  durationMs: number;
  startedAt: string;
}

function WorkflowsPage() {
  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const { data: fileData, isLoading: isFileLoading } = useFile(currentFileId);

  const activeAnalysisSummary = fileData?.analyses?.[0]; // Get latest analysis
  const { data: analysisData, isLoading: isAnalysisLoading } = useAnalysis(activeAnalysisSummary?.id || null);

  const results = analysisData?.result;

  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [activeExecId, setActiveExecId] = useState<string | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  // Load executions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("workflow-executions");
    if (saved) {
      try {
        setExecutions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load workflow executions", e);
      }
    } else {
      // Seed default previous executions
      const initial: WorkflowExecution[] = [
        {
          id: "EXEC-841",
          workflowId: "month_end",
          workflowName: "Month-End Close Orchestration",
          status: "completed",
          trigger: "First Day of Month (Scheduled)",
          resultSummary: "All transactions verified, GSTR draft locked, health score regenerated.",
          durationMs: 8400,
          startedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        },
        {
          id: "EXEC-720",
          workflowId: "board_prep",
          workflowName: "Board Meeting Preparation",
          status: "completed",
          trigger: "CFO Manual Trigger",
          resultSummary: "Executive talking points compiled, Q&A pack seeded to Board portal.",
          durationMs: 9500,
          startedAt: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(),
        }
      ];
      setExecutions(initial);
      localStorage.setItem("workflow-executions", JSON.stringify(initial));
    }
  }, []);

  const saveExecutions = (updated: WorkflowExecution[]) => {
    setExecutions(updated);
    localStorage.setItem("workflow-executions", JSON.stringify(updated));
  };

  const workflowDefs: WorkflowDef[] = [
    {
      id: "month_end",
      name: "Month-End Close Orchestration",
      trigger: "First Day of Month / On-Demand",
      description: "Sequentially verifies ledger transactions, runs GSTR tax matching, audits cash balances, and generates the final monthly closing MIS.",
      icon: CalendarRange,
      iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      steps: [
        "Ingesting transaction database snapshot...",
        "Accounting AI: Auditing categories and checking ledger balances...",
        "Compliance AI: Verifying tax matching against GSTR-2B logs...",
        "Reporting AI: Compiling final Monthly Brief and ledger P&L closing indices...",
        "Chief Command AI: Synchronizing aggregate health vectors..."
      ]
    },
    {
      id: "liquidity_crisis",
      name: "Liquidity Crisis Response",
      trigger: "Treasury AI threshold alert (< 3 months runway)",
      description: "Initiated when liquid reserves dip. Conducts stress-testing under dynamic churn models, checks reinvestments, and structures financing recommendations.",
      icon: Flame,
      iconColor: "text-red-500 bg-red-500/10 border-red-500/20",
      steps: [
        "Scanning liquid asset positions and high-yield reserve accounts...",
        "Treasury AI: Executing extreme stress-test scenarios (worst-case churn)...",
        "Planning AI: Calculating runway models and recommending capital allocation shifts...",
        "Decision AI: Generating founder-aligned fundraising timeline items...",
        "Chief Command AI: Firing high-priority notifications to founder board..."
      ]
    },
    {
      id: "compliance_deadline",
      name: "Compliance Deadline Escalation",
      trigger: "Compliance deadline approaching (< 3 days)",
      description: "Triggered under high-priority tax dates. Gathers outstanding filing logs, verifies GST reconciliation reports, and initiates escalation brief to auditors.",
      icon: AlertOctagon,
      iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      steps: [
        "Mapping SEBI and GST regulatory calendars...",
        "Compliance AI: Compiling pending filings and TDS reports...",
        "Accounting AI: Double-checking for invoice consistency discrepancies...",
        "Chief Command AI: Drafting escalation notification logs for CFO review...",
        "Delivering regulatory filing brief to company advisory boards..."
      ]
    },
    {
      id: "fundraising_readiness",
      name: "Fundraising Readiness Package",
      trigger: "CFO Trigger / Planning AI runway < 12 months",
      description: "Assembles key P&L models, compiles burn rate scenarios, maps investor guidelines, and prepares an aggregated financial narrative package.",
      icon: TrendingUp,
      iconColor: "text-violet-500 bg-violet-500/10 border-violet-500/20",
      steps: [
        "Re-calculating key EBITDA metrics and growth MoM metrics...",
        "Planning AI: Running conservative, base, and optimistic scenario forecasts...",
        "Research AI: Scraping sector pricing variables and monetary indexes...",
        "Reporting AI: Designing aggregated multi-page financial metrics pack...",
        "Chief Command AI: Running audit review on data package..."
      ]
    },
    {
      id: "board_prep",
      name: "Board Meeting Preparation",
      trigger: "CFO manual request / T-2 days scheduled",
      description: "Synthesizes multi-module KPIs into a structured Board Package, generates print-ready narratives, and compiles Groq anticipated Board Q&As.",
      icon: FileSpreadsheet,
      iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      steps: [
        "Fetching 7-dimension Finance Health Score parameters...",
        "Reporting AI: Compiling executive narratives and performance summaries...",
        "Decision AI: Extracting recommended choices and capital allocations...",
        "Chief Command AI: Processing Groq-generated meeting talking points...",
        "Assembling print-ready Board Package and anticipated board questions..."
      ]
    }
  ];

  const handleExecute = (wDef: WorkflowDef) => {
    if (activeExecId) return; // Wait for current to finish

    const execId = `EXEC-${Math.floor(Math.random() * 900) + 100}`;
    const newExec: WorkflowExecution = {
      id: execId,
      workflowId: wDef.id,
      workflowName: wDef.name,
      status: "running",
      trigger: "CFO Manual Trigger",
      resultSummary: "Running sequential agent operations...",
      durationMs: 0,
      startedAt: new Date().toISOString(),
    };

    // Prepend to executions list
    const updatedList = [newExec, ...executions];
    saveExecutions(updatedList);
    setActiveExecId(execId);
    setCurrentStepIdx(0);
    setExecutionLogs([`[System] Launching ${wDef.name}`, `[System] Trigger: CFO Manual Trigger`]);

    const startPerf = performance.now();
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < wDef.steps.length) {
        setCurrentStepIdx(currentStep);
        setExecutionLogs((prev) => [
          ...prev,
          `[Agent] ${wDef.steps[currentStep]}`
        ]);
      } else {
        clearInterval(interval);
        const duration = Math.round(performance.now() - startPerf);

        // Finalize execution
        const finalExec: WorkflowExecution = {
          ...newExec,
          status: "completed",
          resultSummary: getResultSummary(wDef.id),
          durationMs: duration,
        };

        const finalizedList = updatedList.map((e) => (e.id === execId ? finalExec : e));
        saveExecutions(finalizedList);
        setActiveExecId(null);
        setCurrentStepIdx(-1);
        setExecutionLogs((prev) => [
          ...prev,
          `[System] Workflow completed successfully in ${(duration / 1000).toFixed(2)}s.`
        ]);
      }
    }, 1800);
  };

  const getResultSummary = (id: string): string => {
    switch (id) {
      case "month_end": return "All transactions verified, GSTR draft locked, health score regenerated.";
      case "liquidity_crisis": return "Worst-case churn stress test run. capital preservation deck compiled.";
      case "compliance_deadline": return "GST returns locked and escalation report routed to auditors.";
      case "fundraising_readiness": return "Scenario forecasting completed. Financial package delivered to founder.";
      case "board_prep": return "Executive talking points compiled, Q&A pack seeded to Board portal.";
      default: return "Execution completed nominal bounds.";
    }
  };

  const activeWorkflow = activeExecId ? workflowDefs.find((w) => w.id === executions.find((e) => e.id === activeExecId)?.workflowId) : null;

  if (isFileLoading || isAnalysisLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Agent Workflows...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentFileId || !results) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-sm mx-auto">
          <Workflow className="h-12 w-12 text-primary animate-pulse mb-4" />
          <h3 className="text-lg font-bold">No Financial Data Available</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Please run the AI CFO Pipeline on the Dashboard first before triggers or orchestrations can be evaluated.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 stage-enter">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Orchestrate complex sequences of actions that span multiple AI agents. Run month-end closings, stress tests, or prepare packages with a single click.
          </p>
        </div>

        {/* Live Execution Screen */}
        {activeExecId && activeWorkflow && (
          <Card className="p-5 border border-primary/20 bg-primary/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <Workflow className="h-4 w-4 text-primary animate-spin" /> Active Execution: {activeWorkflow.name}
              </span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {activeExecId}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>Progress: {Math.round(((currentStepIdx + 1) / activeWorkflow.steps.length) * 100)}%</span>
                <span>Step {currentStepIdx + 1} of {activeWorkflow.steps.length}</span>
              </div>
              <Progress value={((currentStepIdx + 1) / activeWorkflow.steps.length) * 100} className="h-2 bg-primary/10" />
            </div>

            {/* Live Logs Terminal */}
            <div className="rounded-lg border border-border bg-black/90 p-4 font-mono text-[10px] leading-relaxed text-emerald-400 whitespace-pre-wrap min-h-[140px] max-h-[180px] overflow-y-auto space-y-1">
              {executionLogs.map((log, idx) => (
                <div key={idx} className={cn(log.startsWith("[System]") ? "text-primary" : "text-emerald-400")}>
                  {log}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 5 Workflows Grid */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" /> Orchestration Catalog (5 Built-in Workflows)
          </span>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflowDefs.map((wDef) => {
              const Icon = wDef.icon;
              const isExecutingThis = activeWorkflow?.id === wDef.id;

              return (
                <Card key={wDef.id} className="p-4 border border-border/60 bg-card hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border", wDef.iconColor)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-right min-w-0">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground truncate block">Trigger Condition</span>
                        <span className="text-[10px] font-semibold text-foreground truncate block mt-0.5" title={wDef.trigger}>
                          {wDef.trigger}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground">{wDef.name}</h4>
                      <p className="text-[10px] text-muted-foreground leading-normal min-h-[48px]">
                        {wDef.description}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleExecute(wDef)}
                    disabled={!!activeExecId}
                    className="w-full h-8 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-[11px] flex items-center justify-center gap-1.5 rounded-md"
                  >
                    {isExecutingThis ? (
                      <>
                        <Activity className="h-3 w-3 animate-spin" /> Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-primary-foreground" /> Execute Workflow
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Execution History */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" /> Orchestration Execution Log
          </span>

          <Card className="border border-border/60 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/55 bg-muted/30 text-muted-foreground uppercase font-bold text-[9px] tracking-wider">
                    <th className="p-3">Execution ID</th>
                    <th className="p-3">Workflow Name</th>
                    <th className="p-3">Trigger Source</th>
                    <th className="p-3">Result Summary</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {executions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground text-xs">
                        No previous workflow executions recorded.
                      </td>
                    </tr>
                  ) : (
                    executions.map((e) => (
                      <tr key={e.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-mono font-bold text-[10px]">{e.id}</td>
                        <td className="p-3 text-foreground font-semibold">{e.workflowName}</td>
                        <td className="p-3 text-muted-foreground">{e.trigger}</td>
                        <td className="p-3 text-foreground/90 max-w-[200px] truncate" title={e.resultSummary}>
                          {e.resultSummary}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-muted-foreground">
                          {e.durationMs > 0 ? `${(e.durationMs / 1000).toFixed(2)}s` : "--"}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-muted-foreground">
                          {new Date(e.startedAt).toLocaleString("default", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="p-3 text-right">
                          <Badge
                            className={cn(
                              "text-[9px] font-bold uppercase",
                              e.status === "completed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              e.status === "running" ? "bg-primary/10 text-primary border-primary/20 animate-pulse" :
                              "bg-red-500/10 text-red-500 border-red-500/20"
                            )}
                            variant="outline"
                          >
                            {e.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
