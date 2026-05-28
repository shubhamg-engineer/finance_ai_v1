import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMacroPulse, useMarketData } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Globe, TrendingUp, TrendingDown, Newspaper, AlertCircle, CheckCircle2, BarChart2, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/research")({ component: ResearchPage });

function ResearchPage() {
  const { data: macro } = useMacroPulse();
  const { data: markets } = useMarketData();

  const sentimentMap: Record<string, { color: string; label: string }> = {
    positive: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "Positive" },
    negative: { color: "text-red-500 bg-red-500/10 border-red-500/20", label: "Risk" },
    neutral: { color: "text-amber-500 bg-amber-500/10 border-amber-500/20", label: "Neutral" },
  };

  const sectorRiskColor: Record<string, string> = {
    low: "text-emerald-500",
    medium: "text-amber-500",
    high: "text-red-500",
  };

  // Build a mini chart from market indices
  const indexChart = markets?.tickers
    .filter(t => ["SENSEX", "NIFTY50", "SPX"].includes(t.symbol))
    .map(t => ({ name: t.symbol, price: t.price, change: t.change_pct })) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6 stage-enter">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Research & Macro Intelligence</h1>
          <p className="text-xs text-muted-foreground mt-1">Live macroeconomic signals · Sector risk · News sentiment</p>
        </div>

        {/* Overall Sentiment + Central Bank Rates */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {macro && [
            { label: "RBI Repo Rate", value: `${macro.central_bank_rates.rbi_repo}%`, sub: "India", color: "text-violet-500" },
            { label: "US Fed Rate", value: `${macro.central_bank_rates.us_fed}%`, sub: "United States", color: "text-blue-500" },
            { label: "India CPI", value: `${macro.inflation.india_cpi}%`, sub: macro.inflation.as_of, color: "text-amber-500" },
            { label: "India WPI", value: `${macro.inflation.india_wpi}%`, sub: macro.inflation.as_of, color: "text-emerald-500" },
          ].map(item => (
            <Card key={item.label} className="p-4 border border-border/60 space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <p className={cn("text-2xl font-bold", item.color)}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.sub}</p>
            </Card>
          ))}
        </div>

        {/* Sector Risk Matrix */}
        <Card className="p-5 border border-border/60 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sector Risk Pulse</span>
            <Badge className="ml-auto text-[9px] bg-primary/10 text-primary border-primary/20">
              {macro?.overall_sentiment?.replace(/_/g, " ") ?? "Neutral"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {macro && Object.entries(macro.sector_risk).map(([sector, risk]) => (
              <div key={sector} className="p-3 rounded-xl border border-border/50 text-center space-y-1 hover:border-primary/30 transition-all">
                <p className="text-[10px] text-muted-foreground capitalize">{sector.replace(/_/g, " ")}</p>
                <p className={cn("text-xs font-bold capitalize", sectorRiskColor[risk] || "text-foreground")}>{risk}</p>
                <div className={cn("h-1.5 rounded-full mx-auto w-3/4",
                  risk === "low" ? "bg-emerald-500/60" : risk === "medium" ? "bg-amber-500/60" : "bg-red-500/60")} />
              </div>
            ))}
          </div>
        </Card>

        {/* Market Index Summary */}
        {markets && (
          <Card className="p-5 border border-border/60 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Key Index Performance</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {markets.tickers.filter(t => ["SENSEX","NIFTY50","BANKNIFTY","SPX","NASDAQ","BTCUSD"].includes(t.symbol)).map(t => (
                <div key={t.symbol} className="p-3 rounded-lg border border-border/50 space-y-1">
                  <p className="text-[9px] font-mono text-muted-foreground">{t.symbol}</p>
                  <p className="text-sm font-bold">{t.currency === "INR" ? "₹" : "$"}{t.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                  <p className={cn("text-[10px] font-bold flex items-center gap-0.5", t.direction === "up" ? "text-emerald-500" : "text-red-500")}>
                    {t.direction === "up" ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {t.change_pct > 0 ? "+" : ""}{t.change_pct.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* News Intelligence Feed */}
        <Card className="p-5 border border-border/60 space-y-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live Financial Intelligence Feed</span>
          </div>
          <div className="space-y-2">
            {(macro?.news ?? []).map((n, i) => {
              const s = sentimentMap[n.sentiment] ?? sentimentMap.neutral;
              return (
                <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border", s.color.replace("text-", "border-").split(" ")[0] + "/20", "bg-muted/10")}>
                  {n.sentiment === "positive"
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    : n.sentiment === "negative"
                    ? <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    : <Globe className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{n.headline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-muted-foreground">{n.source}</span>
                      <Badge className={cn("text-[9px] border", s.color)}>{s.label}</Badge>
                      <Badge variant="outline" className="text-[9px]">{n.impact}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Predictive Risk Alerts */}
        <Card className="p-5 border border-amber-500/20 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Research AI — Predictive Macro Alerts</span>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { alert: "RBI rate hold extends accommodative cycle — favourable for growth-stage funding rounds in H2 2026.", severity: "info" },
              { alert: "Crude oil +2.3% YTD — logistics and travel cost escalation risk for Q3 expenses.", severity: "warning" },
              { alert: "SEBI new KYC circular effective July 2026 — review fintech onboarding flows before deadline.", severity: "critical" },
            ].map((a, i) => (
              <div key={i} className={cn("flex items-start gap-2 p-2.5 rounded-lg",
                a.severity === "critical" ? "bg-red-500/10 border border-red-500/20" :
                a.severity === "warning" ? "bg-amber-500/10 border border-amber-500/20" :
                "bg-blue-500/10 border border-blue-500/20")}>
                <span className={cn("font-bold shrink-0", a.severity === "critical" ? "text-red-500" : a.severity === "warning" ? "text-amber-500" : "text-blue-500")}>
                  {a.severity === "critical" ? "🔴" : a.severity === "warning" ? "🟡" : "🔵"}
                </span>
                <p className="text-foreground/90">{a.alert}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
