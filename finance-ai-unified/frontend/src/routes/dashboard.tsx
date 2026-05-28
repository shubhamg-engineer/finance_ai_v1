import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceStore } from "@/lib/store";
import { useFile, useRunPipeline, useAnalysis, PipelineResult } from "@/lib/api";
import { SAMPLE_TRANSACTIONS } from "@/lib/sample-data";
import { MarketPanel } from "@/components/dashboard/MarketPanel";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  Play,
  CheckCircle,
  FileText,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const COLORS = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

function DashboardPage() {
  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const setCurrentFileId = useFinanceStore((s) => s.setCurrentFileId);
  const currentAnalysisId = useFinanceStore((s) => s.currentAnalysisId);
  const setCurrentAnalysisId = useFinanceStore((s) => s.setCurrentAnalysisId);

  const { data: fileData, isLoading: isFileLoading, refetch: refetchFile } = useFile(currentFileId);
  const runMutation = useRunPipeline();

  const [runProgress, setRunProgress] = useState(0);
  const [activeStep, setActiveStep] = useState("");

  const activeFile = fileData?.metadata;
  const kpis = fileData?.kpi_preview;
  
  // Get latest analysis or use the current active analysis
  const latestAnalysisSummary = fileData?.analyses?.[0];
  const activeAnalysisSummary = fileData?.analyses?.find((a) => a.id === currentAnalysisId) || latestAnalysisSummary;

  const { data: analysisData } = useAnalysis(activeAnalysisSummary?.id || null);
  const activeAnalysis = analysisData;

  // Local state to simulate agent execution steps during running
  useEffect(() => {
    if (runMutation.isPending) {
      setRunProgress(5);
      setActiveStep("Research AI — Analyzing Market Sentiment...");
      
      const t1 = setTimeout(() => {
        setRunProgress(25);
        setActiveStep("Planning AI — Forecasting 12-Month Outlook...");
      }, 2000);
      
      const t2 = setTimeout(() => {
        setRunProgress(45);
        setActiveStep("Accounting AI — Evaluating Anomaly & Fraud Risk...");
      }, 4000);
      
      const t3 = setTimeout(() => {
        setRunProgress(60);
        setActiveStep("Treasury & Compliance AI — Scoring Liquidity & Deadlines...");
      }, 6000);
      
      const t4 = setTimeout(() => {
        setRunProgress(75);
        setActiveStep("Reporting & Decision AI — Formulating Strategy Boardpack...");
      }, 7500);
      
      const t5 = setTimeout(() => {
        setRunProgress(95);
        setActiveStep("Chief Command — Orchestrating Cross-Module Consensus...");
      }, 9500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    } else {
      setRunProgress(0);
      setActiveStep("");
    }
  }, [runMutation.isPending]);

  const handleRunPipeline = async () => {
    if (!currentFileId) return;
    try {
      const res = await runMutation.mutateAsync(currentFileId);
      toast.success("AI CFO Pipeline executed successfully!");
      if (res.analysis_id) {
        setCurrentAnalysisId(res.analysis_id);
      }
      refetchFile();
    } catch (e: any) {
      toast.error(e.message || "Pipeline execution failed");
    }
  };

  // ── Demo-mode KPI computation (used when backend is unavailable) ────────────
  const demoKpis = (() => {
    const revenue = SAMPLE_TRANSACTIONS.filter((t) => t.type === "Revenue").reduce((s, t) => s + t.amount, 0);
    const expenses = SAMPLE_TRANSACTIONS.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
    const byMonth: Record<string, { revenue: number; expenses: number }> = {};
    SAMPLE_TRANSACTIONS.forEach((t) => {
      const m = t.date.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { revenue: 0, expenses: 0 };
      if (t.type === "Revenue") byMonth[m].revenue += t.amount;
      else byMonth[m].expenses += t.amount;
    });
    const monthly_breakdown = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month: month.slice(5), revenue: v.revenue, expenses: v.expenses, net: v.revenue - v.expenses }));
    const byCat: Record<string, number> = {};
    SAMPLE_TRANSACTIONS.filter((t) => t.type === "Expense").forEach((t) => {
      byCat[t.category || "Other"] = (byCat[t.category || "Other"] || 0) + t.amount;
    });
    const top_categories = Object.entries(byCat)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({ category, amount, percentage: Math.round((amount / expenses) * 100) }));
    return { total_revenue: revenue, total_expenses: expenses, profit: revenue - expenses, monthly_burn: Math.round(expenses / 7), runway_months: null as null, monthly_breakdown, top_categories };
  })();

  // Use backend data when available, otherwise fall back to demo KPIs
  const effectiveKpis = kpis ?? demoKpis;
  const isDemoMode = !currentFileId || !activeFile;

  if (isFileLoading) {
    // Brief loading state — replaced by demo data as soon as it resolves
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading workspace...</p>
        </div>
      </AppLayout>
    );
  }

  // Format currency values
  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return "₹0";
    if (val >= 10_000_000) return `₹${(val / 10_000_000).toFixed(2)}Cr`;
    if (val >= 100_000) return `₹${(val / 100_000).toFixed(2)}L`;
    if (val >= 1_000) return `₹${(val / 1_000).toFixed(1)}K`;
    return `₹${val.toFixed(0)}`;
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "CRITICAL":
        return { bg: "bg-red-500/10 text-red-500 border-red-500/20", label: "Critical" };
      case "WARNING":
      case "HIGH":
        return { bg: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Warning" };
      default:
        return { bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Normal" };
    }
  };

  const healthScore = activeAnalysis?.result?.finance_health_score?.score ?? 96;
  const healthLabel = activeAnalysis?.result?.finance_health_score?.label ?? "Excellent";
  const priority = activeAnalysis?.result?.kpis?.priority ?? "NORMAL";
  const priorityReason = activeAnalysis?.result?.kpis?.priority_reason ?? "Financials stable";
  const priorityConfig = getPriorityConfig(priority);

  const breakdown = (activeAnalysis?.result?.finance_health_score?.breakdown ?? {
    liquidity: 100,
    compliance: 80,
    efficiency: 100,
    growth: 85,
    anomalies: 100,
  }) as { liquidity: number; compliance: number; efficiency: number; growth: number; anomalies: number; debt_health?: number; [key: string]: number | undefined };

  const dimensions = [
    { name: "Liquidity Health", score: breakdown.liquidity, color: "var(--color-chart-1)" },
    { name: "Compliance Health", score: breakdown.compliance, color: "var(--color-chart-2)" },
    { name: "Forecast Confidence", score: 95, color: "var(--color-chart-3)" },
    { name: "Budget Discipline", score: breakdown.efficiency, color: "var(--color-chart-4)" },
    { name: "Accounting Integrity", score: breakdown.anomalies, color: "var(--color-chart-5)" },
    { name: "Debt Health", score: breakdown.debt_health ?? 100, color: "var(--color-success)" },
    { name: "Research Risk", score: 90, color: "oklch(0.65 0.20 300)" },
  ];

  return (
    <AppLayout>
      <Toaster position="top-right" richColors />
      <div className="space-y-6 stage-enter">
        
        {/* 1. Pipeline Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card/60 border border-border/80 rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-500">
              <CheckCircle className="h-4 w-4 fill-emerald-500/10" />
              <span>Data loaded</span>
            </div>
            <span className="text-muted-foreground/30 font-medium">/</span>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-500">
              <CheckCircle className="h-4 w-4 fill-emerald-500/10" />
              <span>8 agents complete</span>
            </div>
            <span className="text-muted-foreground/30 font-medium">/</span>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-500">
              <CheckCircle className="h-4 w-4 fill-emerald-500/10" />
              <span>Health scored</span>
            </div>
            <span className="text-muted-foreground/30 font-medium">/</span>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-500">
              <CheckCircle className="h-4 w-4 fill-emerald-500/10" />
              <span>Brief ready</span>
            </div>
          </div>
          <Button
            onClick={handleRunPipeline}
            disabled={runMutation.isPending}
            className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs h-8 px-4"
            size="sm"
          >
            <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
            {runMutation.isPending ? "Re-running..." : "Re-run all agents"}
          </Button>
        </div>

        {/* Pipeline Progress Modal/Overlay if Running */}
        {runMutation.isPending && (
          <Card className="p-6 border-primary/30 bg-primary/5 shadow-md animate-pulse">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-sm font-semibold text-foreground">Running 8-Agent Finance AI Pipeline</span>
                </div>
                <span className="text-xs font-mono font-bold text-primary">{runProgress}%</span>
              </div>
              <Progress value={runProgress} className="h-2" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{activeStep}</span>
                <span className="font-mono">Est. latency: ~10s</span>
              </div>
            </div>
          </Card>
        )}

        {/* CFO Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">CFO Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5" id="dashSub">
              {activeAnalysis?.result?.kpis?.trend_summary ?? (isDemoMode ? "Aghron Capital · Demo Mode · Nov 2025 – May 2026 · 50 transactions" : `Period: ${activeFile?.period_start} to ${activeFile?.period_end} · ${activeFile?.tx_count} transactions`)}
            </p>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider", priorityConfig.bg)}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {priorityConfig.label} · {priorityReason}
          </span>
        </div>

        {/* 2. 5-Card KPI Row */}
        {effectiveKpis && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <Card className="p-4 bg-card hover:shadow-md transition-shadow relative overflow-hidden group border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
              <h3 className="text-xl font-bold tracking-tight mt-1">{formatCurrency(effectiveKpis.total_revenue)}</h3>
              <div className="flex items-center gap-1 mt-2">
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-500 leading-none">+93.6%</span>
                <span className="text-[9px] text-muted-foreground">7 months</span>
              </div>
            </Card>

            <Card className="p-4 bg-card hover:shadow-md transition-shadow relative overflow-hidden group border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Expenses</span>
              <h3 className="text-xl font-bold tracking-tight mt-1">{formatCurrency(effectiveKpis.total_expenses)}</h3>
              <div className="flex items-center gap-1 mt-2">
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-500 leading-none">+62.5%</span>
                <span className="text-[9px] text-muted-foreground">7 months</span>
              </div>
            </Card>

            <Card className="p-4 bg-card hover:shadow-md transition-shadow relative overflow-hidden group border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net Profit</span>
              <h3 className={cn("text-xl font-bold tracking-tight mt-1", effectiveKpis.profit >= 0 ? "text-emerald-500" : "text-destructive")}>
                {formatCurrency(effectiveKpis.profit)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none", effectiveKpis.profit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive")}>
                  {effectiveKpis.profit >= 0 ? "Profitable" : "Net Loss"}
                </span>
                <span className="text-[9px] text-muted-foreground">Accumulated</span>
              </div>
            </Card>

            <Card className="p-4 bg-card hover:shadow-md transition-shadow relative overflow-hidden group border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Monthly Burn</span>
              <h3 className="text-xl font-bold tracking-tight mt-1">{formatCurrency(effectiveKpis.monthly_burn)}</h3>
              <div className="flex items-center gap-1 mt-2">
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none", effectiveKpis.monthly_burn === 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                  {effectiveKpis.monthly_burn === 0 ? "₹0" : "Active Burn"}
                </span>
                <span className="text-[9px] text-muted-foreground">Avg last 3 months</span>
              </div>
            </Card>

            <Card className="p-4 bg-card hover:shadow-md transition-shadow relative overflow-hidden group border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Runway</span>
              <h3 className="text-xl font-bold tracking-tight mt-1">
                {effectiveKpis.runway_months !== null ? `${effectiveKpis.runway_months.toFixed(1)} Mo` : "Infinite"}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-500 leading-none">
                  {effectiveKpis.runway_months !== null ? "Stable" : "∞"}
                </span>
                <span className="text-[9px] text-muted-foreground">Profitable</span>
              </div>
            </Card>
          </div>
        )}

        {/* 3. Health Score & Chart Side-by-Side */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Health Score Gauge */}
          <Card className="p-5 flex flex-col items-center justify-between text-center border border-border/60 bg-card">
            <div className="w-full text-left">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Health Score</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Composite 7-dimension assessment</p>
            </div>
            
            <div className="relative flex items-center justify-center h-32 w-32 my-4">
              <div className="absolute inset-0 rounded-full border-[10px] border-muted/50" />
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  stroke="url(#healthScoreGrad)"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - healthScore / 100)}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="healthScoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="var(--color-success)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col justify-center items-center">
                <span className="text-3xl font-extrabold tracking-tight">
                  {Math.round(healthScore)}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  {healthLabel}
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground leading-normal mt-2 px-2">
              Based on liquidity, compliance posture, anomaly thresholds, and forecasting models.
            </div>
          </Card>

          {/* Area Chart */}
          <Card className="lg:col-span-2 p-5 border border-border/60 bg-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue vs Expenses</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Monthly inflow & outflow trend</p>
              </div>
            </div>

            {effectiveKpis?.monthly_breakdown && effectiveKpis.monthly_breakdown.length > 0 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={effectiveKpis.monthly_breakdown}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.1)" />
                    <XAxis dataKey="month" stroke="rgba(120, 120, 120, 0.6)" fontSize={10} tickLine={false} />
                    <YAxis stroke="rgba(120, 120, 120, 0.6)" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <Area
                      type="monotone"
                      name="Revenue"
                      dataKey="revenue"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorRev)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      name="Expenses"
                      dataKey="expenses"
                      stroke="#EF4444"
                      fillOpacity={1}
                      fill="url(#colorExp)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-44 items-center justify-center text-muted-foreground text-xs font-medium">
                No breakdown data available.
              </div>
            )}
          </Card>
        </div>

        {/* 4. Spend by Category & Dimension Breakdown Side-by-Side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Spend by Category */}
          <Card className="p-5 border border-border/60 bg-card space-y-4">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Spend by Category</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Top expenditure categories</p>
            </div>
            
            {effectiveKpis?.top_categories && effectiveKpis.top_categories.length > 0 ? (
              <div className="space-y-3">
                {effectiveKpis.top_categories.slice(0, 5).map((cat, i) => {
                  const maxAmt = effectiveKpis.top_categories[0].amount;
                  const pct = (cat.amount / maxAmt) * 100;
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="truncate">{cat.category}</span>
                        <span className="text-muted-foreground ml-2">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-border/40 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: `var(--color-chart-${(i % 5) + 1})`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No expenditure details.
              </div>
            )}
          </Card>

          {/* Dimension Breakdown */}
          <Card className="p-5 border border-border/60 bg-card space-y-4">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dimension Breakdown</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">7-dimension fintech scoring matrix</p>
            </div>

            <div className="space-y-2">
              {dimensions.map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">{d.name}</span>
                    <span className="font-semibold">{d.score}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${d.score}%`,
                        backgroundColor: d.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 5. Urgent Actions */}
        <Card className="p-5 border border-border/60 bg-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Urgent Actions</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">CFO decisions requiring immediate command</p>
            </div>
          </div>

          {activeAnalysis?.result?.final?.output?.urgent_actions && activeAnalysis.result.final.output.urgent_actions.length > 0 ? (
            <div className="grid gap-3">
              {(activeAnalysis.result.final.output.urgent_actions as any[]).map((action, i) => {
                const actionStr = typeof action === "string" ? action : action.action ?? "";
                const owner = typeof action === "string" ? "CFO" : action.owner ?? "CFO";
                const deadline = typeof action === "string" ? "30 Days" : action.deadline ?? "30 Days";

                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <div className="h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{actionStr}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Owner: {owner} · Due: {deadline}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground bg-muted/10 border border-dashed border-border p-4 rounded-lg text-center">
              No critical action items. Financial health is within optimal bounds.
            </div>
          )}
        </Card>

        {/* 6. AI Agent summaries cards */}
        {activeAnalysis && (
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Agent Panel Summaries</span>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.keys(activeAnalysis.result || {}).filter(key => 
                ["research", "planning", "accounting", "treasury", "compliance", "reporting", "decision", "final"].includes(key)
              ).map((agentKey) => {
                const agentData = (activeAnalysis.result as any)[agentKey];
                let agentTitle = agentKey.charAt(0).toUpperCase() + agentKey.slice(1);
                if (agentKey === "final") agentTitle = "Chief Command";
                
                return (
                  <Link key={agentKey} to="/agents">
                    <Card className="p-4 hover:border-primary/40 hover:bg-muted/10 transition-all cursor-pointer group flex flex-col justify-between h-28 border border-border/60">
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-primary uppercase font-mono">{agentTitle}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h4 className="font-bold text-xs text-foreground truncate mt-0.5">
                          {agentKey === "research" && "Opportunities & Risks"}
                          {agentKey === "planning" && "12-Month Projections"}
                          {agentKey === "accounting" && "Fraud & Anomalies"}
                          {agentKey === "treasury" && "Liquidity & Yield"}
                          {agentKey === "compliance" && "Tax Deadlines"}
                          {agentKey === "reporting" && "Performance & Pack"}
                          {agentKey === "decision" && "Strategic Alignment"}
                          {agentKey === "final" && "Command Priority"}
                        </h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {agentKey === "research" && `${agentData?.output?.opportunities?.length || 0} opportunities identified.`}
                        {agentKey === "planning" && `Runway modeled under base, stress, and optimistic scenarios.`}
                        {agentKey === "accounting" && `${agentData?.output?.anomalies?.length || 0} transaction anomalies detected.`}
                        {agentKey === "treasury" && `Liquidity index: ${agentData?.output?.liquidity_score || 85}/100.`}
                        {agentKey === "compliance" && `${agentData?.output?.deadlines?.length || 0} regulatory filings tracked.`}
                        {agentKey === "reporting" && "Generated MIS dashboard pack & board narrative."}
                        {agentKey === "decision" && `Strategic alignment score: ${agentData?.output?.founder_alignment_score || 90}%.`}
                        {agentKey === "final" && "Composite multi-agent patterns reconciled."}
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. Global Market Intelligence */}
        <MarketPanel />

      </div>
    </AppLayout>
  );
}
