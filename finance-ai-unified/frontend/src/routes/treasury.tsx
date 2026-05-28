import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFxRates, useMacroPulse, useMarketData } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Globe, Zap, ShieldCheck, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/treasury")({ component: TreasuryPage });

function fmt(v: number, cur = "INR") {
  if (cur === "INR") {
    if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(2)}Cr`;
    if (v >= 100_000) return `₹${(v / 100_000).toFixed(2)}L`;
    return `₹${v.toFixed(2)}`;
  }
  return `${cur} ${v.toFixed(2)}`;
}

function TreasuryPage() {
  const { data: fx } = useFxRates();
  const { data: markets } = useMarketData();
  const { data: macro } = useMacroPulse();

  const usdInr = markets?.usdinr ?? 83.5;

  const riskColor: Record<string, string> = {
    "Very Low": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Sovereign: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    High: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <AppLayout>
      <div className="space-y-6 stage-enter">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Treasury & FX Management</h1>
          <p className="text-xs text-muted-foreground mt-1">Multi-currency view · INR primary · USD secondary · Real-time FX</p>
        </div>

        {/* FX Rates Grid */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Live Forex Rates (INR Base)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fx && Object.entries(fx.rates).map(([cur, rate]) => {
              const usdEquiv = rate / usdInr;
              return (
                <Card key={cur} className="p-4 border border-border/60 space-y-1 hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">{cur}/INR</span>
                    <Globe className="h-3 w-3 text-primary/50" />
                  </div>
                  <p className="text-xl font-bold">₹{rate.toFixed(cur === "JPY" ? 4 : 2)}</p>
                  <p className="text-[10px] text-muted-foreground">≈ ${usdEquiv.toFixed(4)} USD</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FX Exposure Analysis */}
        <Card className="p-5 border border-border/60 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">FX Exposure Analysis</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { cur: "USD", exposure_inr: 842000, type: "Payable", hedged: false },
              { cur: "EUR", exposure_inr: 312000, type: "Receivable", hedged: true },
              { cur: "SGD", exposure_inr: 195000, type: "Payable", hedged: false },
            ].map(e => (
              <div key={e.cur} className={cn("p-3 rounded-xl border", e.hedged ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5")}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold">{e.cur} {e.type}</span>
                  <Badge className={cn("text-[9px]", e.hedged ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600")}>{e.hedged ? "Hedged" : "Unhedged"}</Badge>
                </div>
                <p className="text-sm font-bold">₹{(e.exposure_inr / 100000).toFixed(2)}L</p>
                <p className="text-[10px] text-muted-foreground">{e.cur} {(e.exposure_inr / (fx?.rates[e.cur] ?? 80)).toFixed(0)}</p>
                {!e.hedged && <p className="text-[9px] text-amber-500 mt-1">⚠ Consider forward contract</p>}
              </div>
            ))}
          </div>
        </Card>

        {/* Yield Products Table */}
        <Card className="p-5 border border-border/60 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Global Yield Opportunities</span>
            <span className="text-[10px] text-muted-foreground ml-auto">INR primary · USD secondary</span>
          </div>
          {fx && (
            <div className="space-y-2">
              {fx.yield_products.map((p, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.horizon}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-emerald-500">{p.yield_pct}%</p>
                    <p className="text-[9px] text-muted-foreground">Annual Yield</p>
                  </div>
                  <Badge className={cn("text-[9px] border", riskColor[p.risk] || "bg-muted text-muted-foreground")}>{p.risk}</Badge>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-muted-foreground">{p.currency}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Cash Sweep Recommendation */}
        <Card className="p-5 border border-emerald-500/20 bg-emerald-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Treasury AI Cash Sweep Recommendation</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            Based on current liquidity and 90-day treasury horizon, deploy <strong>₹12L–₹15L</strong> surplus into <strong>Liquid Mutual Funds (7.2% annualised)</strong> or <strong>Corporate FD AAA (7.8%)</strong>. 
            Keep minimum ₹6L as operational buffer (3-month rolling reserve). FX exposure of USD $10,096 (₹8.4L) on payables — consider a 30-day USD forward contract at current rate of ₹{usdInr.toFixed(2)}.
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
