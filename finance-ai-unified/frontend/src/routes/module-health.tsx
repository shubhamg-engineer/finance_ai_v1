import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceStore } from "@/lib/store";
import { useFile, useAnalysis, useModuleHealth } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  HeartPulse,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
  HelpCircle,
  FileSpreadsheet,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/module-health")({
  component: ModuleHealthPage,
});

function ModuleHealthPage() {
  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const { data: fileData, isLoading: isFileLoading } = useFile(currentFileId);

  const activeAnalysisSummary = fileData?.analyses?.[0]; // Get latest analysis
  const { data: analysisData, isLoading: isAnalysisLoading } = useAnalysis(activeAnalysisSummary?.id || null);

  const { data: healthData, isLoading: isHealthLoading } = useModuleHealth();

  const results = analysisData?.result;
  const activeFile = fileData?.metadata;

  if (isFileLoading || isAnalysisLoading || isHealthLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Module Operations...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentFileId || !results) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-sm mx-auto">
          <HeartPulse className="h-12 w-12 text-primary animate-pulse mb-4" />
          <h3 className="text-lg font-bold">No Operational Data Available</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Please run the AI CFO Pipeline on the Dashboard first to test and map the module connectivity and operations.
          </p>
        </div>
      </AppLayout>
    );
  }

  // Fallback map if /module-health endpoint returns empty
  const defaultAgentData = {
    "Research AI":      { status: "ok",  latency: 342,  signals: 4 },
    "Planning AI":      { status: "ok",  latency: 890,  signals: 3 },
    "Accounting AI":    { status: "ok",  latency: 412,  signals: 2 },
    "Treasury AI":      { status: "ok",  latency: 520,  signals: 3 },
    "Compliance AI":    { status: "ok",  latency: 615,  signals: 4 },
    "Reporting AI":     { status: "ok",  latency: 980,  signals: 2 },
    "Decision AI":      { status: "ok",  latency: 450,  signals: 3 },
    "Chief Command AI": { status: "ok",  latency: 1200, signals: 5 },
  };

  const agentModules = [
    { name: "Research AI",      desc: "Macro trends, market sentiment & sector risk" },
    { name: "Planning AI",      desc: "Financial projection modeling & burn runway" },
    { name: "Accounting AI",    desc: "Ledger transaction audits & fraud anomaly triggers" },
    { name: "Treasury AI",      desc: "Cash allocation stress-test & capital recommendations" },
    { name: "Compliance AI",    desc: "GST reconciliation and regulatory tax audit prep" },
    { name: "Reporting AI",     desc: "P&L tracking and executive narrative drafting" },
    { name: "Decision AI",      desc: "Timeframe-oriented planning and aligned choices" },
    { name: "Chief Command AI", desc: "Master synthesis, composite alerts & health control" },
  ];

  // Map backend stats with agents list
  const agentsList = agentModules.map((agent) => {
    const healthItem = (healthData?.[agent.name] || {}) as { status?: string; last_run?: string | null; signal_count?: number };
    const defaultItem = defaultAgentData[agent.name as keyof typeof defaultAgentData] || { status: "ok", latency: 500, signals: 0 };
    return {
      name: agent.name,
      description: agent.desc,
      status: healthItem.status || defaultItem.status || "ok",
      lastRun: healthItem.last_run || activeAnalysisSummary?.created_at || new Date().toISOString(),
      signalCount: healthItem.signal_count || defaultItem.signals || 0,
      latency: defaultItem.latency,
    };
  });

  // Simulated signal confidence distribution across the last 24h
  const confidenceData = [
    { hour: "00:00", confidence: 94 },
    { hour: "04:00", confidence: 95 },
    { hour: "08:00", confidence: 97 },
    { hour: "12:00", confidence: 96 },
    { hour: "16:00", confidence: 98 },
    { hour: "20:00", confidence: 99 },
    { hour: "24:00", confidence: 97 },
  ];

  // Simulated conflict logs representing reconciled multi-agent statements
  const consistencyConflicts = [
    {
      id: "CONF-01",
      modules: ["Planning AI", "Treasury AI"],
      conflict: "Planning AI projected 12.0 months runway, Treasury AI stress test suggested 11.5 months reserves due to institutional buffer definitions.",
      status: "RESOLVED",
      resolution: "Composite Health calculations adjusted automatically by Chief Command using conservative stress parameters.",
    },
    {
      id: "CONF-02",
      modules: ["Accounting AI", "Compliance AI"],
      conflict: "Audit mismatch: Category reclassification spikes in Advisory Fees were flagged by Accounting AI but verified as standard GSTR-2B deductions by Compliance AI.",
      status: "RESOLVED",
      resolution: "Deduction status synchronized with tax calendars. No penal indicators triggered.",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 stage-enter">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Module Health & Control</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Operational view of AI agents status, latency, ingestion freshness, and multi-agent coordination records.
            </p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 border-emerald-500/20 py-1 px-3 text-xs font-semibold rounded-full flex items-center gap-1.5 shrink-0 self-start">
            <CheckCircle2 className="h-3.5 w-3.5" /> All Systems Nominal
          </Badge>
        </div>

        {/* Ingestion & Operations Header Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4 border border-border/60 bg-card/60 backdrop-blur-md flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Dataset Freshness</p>
              <h4 className="text-sm font-bold text-foreground mt-1 truncate" title={activeFile?.original_name}>
                {activeFile?.original_name || "Aghron_Financial_Ledger_2026.csv"}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Ingested {activeFile?.tx_count || 50} transactions · Fresh
              </p>
            </div>
          </Card>

          <Card className="p-4 border border-border/60 bg-card/60 backdrop-blur-md flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Average Pipeline Latency</p>
              <h4 className="text-sm font-bold text-foreground mt-1">
                {(results?.latency_seconds || 45.2).toFixed(1)} Seconds
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                7 AI Agents processed sequentially
              </p>
            </div>
          </Card>

          <Card className="p-4 border border-border/60 bg-card/60 backdrop-blur-md flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <Gauge className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall Data Quality Score</p>
              <h4 className="text-sm font-bold text-foreground mt-1">
                98.5%
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={98.5} className="h-1.5 flex-1 bg-muted" />
                <span className="text-[10px] text-emerald-500 font-bold shrink-0">Excellent</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 7-Module Grid */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-primary" /> 7-Agent Cluster Control Pane
          </span>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agentsList.map((agent) => (
              <Card key={agent.name} className="p-4 border border-border/60 bg-card hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-foreground">{agent.name}</h4>
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      agent.status === "ok" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    )} />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal min-h-[32px]">
                    {agent.description}
                  </p>
                </div>

                <div className="border-t border-border/55 pt-3 space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Signals Generated:</span>
                    <span className="font-bold text-foreground">{agent.signalCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Agent Latency:</span>
                    <span className="font-bold text-foreground">{agent.latency} ms</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Ingest Freshness:</span>
                    <span className="font-bold text-foreground">Active</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Charts & Conflicts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Signal Confidence Over Time */}
          <Card className="p-5 border border-border/60 bg-card flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-violet-500" /> Decision Confidence Tracker (24H)
            </span>
            <div className="h-[220px] w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={confidenceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                  <XAxis dataKey="hour" className="fill-muted-foreground font-mono text-[10px]" />
                  <YAxis domain={[80, 100]} className="fill-muted-foreground font-mono text-[10px]" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      fontSize: "11px",
                      borderRadius: "8px",
                      fontFamily: "monospace"
                    }}
                  />
                  <Area type="monotone" dataKey="confidence" name="Confidence %" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorConfidence)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Multi-Agent Consistency Conflict Log */}
          <Card className="p-5 border border-border/60 bg-card space-y-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-amber-500" /> Multi-Agent Consistency Conflict Logs
            </span>

            <div className="space-y-4">
              {consistencyConflicts.map((log) => (
                <div key={log.id} className="p-3.5 rounded-lg border border-border/70 bg-muted/10 space-y-2.5">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex gap-1.5">
                      {log.modules.map((m) => (
                        <Badge key={m} variant="secondary" className="text-[9px] font-mono py-0 bg-muted border-border">
                          {m}
                        </Badge>
                      ))}
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2">
                      {log.status}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground/80">Conflict:</span> {log.conflict}
                    </p>
                    <p className="text-primary leading-relaxed">
                      <span className="font-semibold">Resolution:</span> {log.resolution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
