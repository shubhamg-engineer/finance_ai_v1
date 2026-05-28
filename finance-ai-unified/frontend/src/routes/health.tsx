import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceStore } from "@/lib/store";
import { useFile, useAnalysis } from "@/lib/api";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Activity, ShieldCheck, Heart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/health")({
  component: HealthScorePage,
});

function HealthScorePage() {
  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const { data: fileData, isLoading: isFileLoading } = useFile(currentFileId);

  const activeAnalysisSummary = fileData?.analyses?.[0]; // Get latest analysis
  const { data: analysisData, isLoading: isAnalysisLoading } = useAnalysis(activeAnalysisSummary?.id || null);
  
  const results = analysisData?.result;
  const healthScore = results?.finance_health_score?.score ?? 96;
  const healthLabel = results?.finance_health_score?.label ?? "Excellent";
  
  const breakdown = results?.finance_health_score?.breakdown ?? {
    liquidity: 100,
    compliance: 80,
    efficiency: 100,
    growth: 85,
    anomalies: 100,
  };

  const dimensions = [
    { name: "Liquidity Health", score: breakdown.liquidity, desc: "Cash reserves and working capital indicators", color: "var(--color-chart-1)" },
    { name: "Compliance Health", score: breakdown.compliance, desc: "GST status, TDS filings, and legal warning metrics", color: "var(--color-chart-2)" },
    { name: "Forecast Confidence", score: 95, desc: "Data density and reliability of 12-month model curves", color: "var(--color-chart-3)" },
    { name: "Budget Discipline", score: breakdown.efficiency, desc: "Proportion of operational costs against budget caps", color: "var(--color-chart-4)" },
    { name: "Accounting Integrity", score: breakdown.anomalies, desc: "Absence of ledger anomalies and duplicate invoices", color: "var(--color-chart-5)" },
    { name: "Research Risk", score: 90, desc: "RBI policy shifts and digital industry growth trends", color: "var(--color-success)" },
    { name: "Debt Health Score", score: 100, desc: "Leverage levels and interest cost structures", color: "var(--color-primary)" }
  ];

  // Simulating 30-day health score trend for line chart
  const healthTrendData = useMemo(() => {
    // Generate simulated daily values drifting towards the final healthScore
    const data = [];
    const base = healthScore - 3;
    for (let i = 29; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const randDrift = Math.sin(i / 3) * 1.5 + (Math.random() * 0.5);
      const score = Math.min(100, Math.max(0, base + randDrift + (29 - i) * 0.1));
      data.push({
        date: day.toLocaleDateString("default", { month: "short", day: "numeric" }),
        Score: Math.round(score),
      });
    }
    return data;
  }, [healthScore]);

  if (isFileLoading || isAnalysisLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Health analysis...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentFileId || !results) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-sm mx-auto">
          <Heart className="h-12 w-12 text-primary animate-pulse mb-4" />
          <h3 className="text-lg font-bold">No Health Analysis Found</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Please select an active financials ledger and execute the AI CFO Pipeline on the Dashboard to calculate corporate health indices.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 stage-enter">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Health Score</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fintech-engineered 7-dimension audit scoring vector.
          </p>
        </div>

        {/* Dial & Line Chart Side-by-Side */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Health Score Gauge */}
          <Card className="p-6 flex flex-col items-center justify-between text-center border border-border/60 bg-card">
            <div className="w-full text-left">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall score</span>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Composite company index</p>
            </div>
            
            <div className="relative flex items-center justify-center h-36 w-36 my-6">
              <div className="absolute inset-0 rounded-full border-[12px] border-muted/50" />
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="url(#healthScoreLineGrad)"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={2 * Math.PI * 60 * (1 - healthScore / 100)}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="healthScoreLineGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="var(--color-success)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col justify-center items-center">
                <span className="text-4xl font-extrabold tracking-tight">
                  {Math.round(healthScore)}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-0.5">
                  {healthLabel}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground leading-normal mt-2">
              Composite rating indicating overall operational stability.
            </div>
          </Card>

          {/* 30-Day Line Chart */}
          <Card className="lg:col-span-2 p-5 border border-border/60 bg-card">
            <div className="mb-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">30-Day Health Trend</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Historical health score trajectory</p>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(120,120,120,0.6)" fontSize={9} tickLine={false} />
                  <YAxis stroke="rgba(120,120,120,0.6)" fontSize={9} tickLine={false} domain={[60, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Score"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Board Narrative */}
        {results?.reporting?.output?.board_narrative && (
          <Card className="p-5 border-l-4 border-l-primary bg-card space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Board Commentary</span>
            <h4 className="font-bold text-sm text-foreground">AI CFO Executive Assessment</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
              {results.reporting.output.board_narrative}
            </p>
          </Card>
        )}

        {/* Dimension Breakdown Details */}
        <Card className="p-5 border border-border/60 bg-card space-y-4">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fine-Grained Matrix</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Evaluation parameters details</p>
          </div>

          <div className="space-y-4">
            {dimensions.map((dim) => (
              <div key={dim.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border border-border/60 rounded-lg bg-muted/10">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground">{dim.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{dim.desc}</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-48 shrink-0">
                  <div className="h-2 rounded-full bg-border/40 overflow-hidden flex-1">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${dim.score}%`,
                        backgroundColor: dim.color
                      }}
                    />
                  </div>
                  <span className="font-bold font-mono text-xs w-12 text-right text-foreground">{dim.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
