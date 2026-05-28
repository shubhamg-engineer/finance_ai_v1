import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAnalyses } from "@/lib/api";
import { useFinanceStore } from "@/lib/store";
import {
  Calendar,
  Activity,
  History,
  TrendingUp,
  Clock,
  ExternalLink,
  Trash2,
  CheckCircle,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  const { data: analyses, isLoading } = useAnalyses();
  const setCurrentFileId = useFinanceStore((s) => s.setCurrentFileId);
  const setCurrentAnalysisId = useFinanceStore((s) => s.setCurrentAnalysisId);

  const handleSelectAnalysis = (fileId: string, analysisId: string) => {
    setCurrentFileId(fileId);
    setCurrentAnalysisId(analysisId);
    navigate({ to: "/dashboard" });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse">Loading history logs...</p>
        </div>
      </AppLayout>
    );
  }

  // Prep trend data (sort chronologically first, then map)
  const chartData = analyses
    ? [...analyses]
        .reverse()
        .map((a) => ({
          date: new Date(a.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
          score: a.health_score,
          file: a.filename.substring(0, 15) + "...",
        }))
    : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review past AI CFO pipeline runs, track health score trends, and reload historical states.
          </p>
        </div>

        {analyses && analyses.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: History Timeline List (2 Columns) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Past Executions</h3>
              <div className="space-y-3.5">
                {analyses.map((an) => {
                  const dateStr = new Date(an.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  });
                  return (
                    <Card key={an.id} className="p-4 hover:border-primary/30 transition-all flex items-start justify-between gap-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground truncate" title={an.filename}>
                            {an.filename}
                          </h4>
                          <Badge variant="outline" className="text-[9px] font-mono">
                            ID: {an.id.substring(0, 8)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {dateStr}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Latency: {an.latency_s}s
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Health Score */}
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Health</span>
                          <span className="text-lg font-extrabold text-foreground font-mono">{an.health_score}/100</span>
                        </div>

                        {/* Action */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSelectAnalysis(an.file_id, an.id)}
                          className="h-8 text-xs flex items-center gap-1 px-3"
                        >
                          Restore <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right: Trend Line Chart (1 Column) */}
            <div className="space-y-6">
              <Card className="p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Finance Health Index Trend</h3>
                {chartData.length > 1 ? (
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={10} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                          labelStyle={{ color: "#fff", fontWeight: "bold" }}
                          itemStyle={{ fontSize: "11px" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Health Index"
                          stroke="#8B5CF6"
                          strokeWidth={2.5}
                          dot={{ fill: "#8B5CF6", strokeWidth: 1 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-14 text-center text-xs text-muted-foreground italic">
                    Requires at least 2 analysis runs to chart health trend.
                  </div>
                )}
              </Card>
            </div>
          </div>
        ) : (
          <Card className="p-12 border border-dashed border-border/80 text-center max-w-lg mx-auto">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <History className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">No Historical Runs</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              You haven't run any AI CFO pipeline analysis yet. Once you load a ledger and run the pipeline, the results will compile here.
            </p>
            <Link to="/" className="mt-4 inline-block">
              <Button size="sm">Go to Workspace Setup</Button>
            </Link>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
