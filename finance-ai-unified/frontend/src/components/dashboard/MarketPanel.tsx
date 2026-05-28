import { useMarketData, useMacroPulse, MarketTicker as TickerItem } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Globe, Newspaper, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer } from "recharts";

// Generates fake sparkline history for visual interest
function useSparkline(base: number, symbol: string) {
  const points = Array.from({ length: 12 }, (_, i) => {
    const noise = Math.sin(i + symbol.charCodeAt(0)) * base * 0.005;
    return { v: base + noise };
  });
  return points;
}

function TickerCard({ item }: { item: TickerItem }) {
  const isUp = item.direction === "up";
  const spark = useSparkline(item.price, item.symbol);

  const formatPrice = (v: number, cur: string) => {
    if (cur === "%") return `${v.toFixed(2)}%`;
    if (cur === "INR") {
      if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(2)}Cr`;
      if (v >= 100_000) return `₹${(v / 100_000).toFixed(2)}L`;
      if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
      return `₹${v.toFixed(2)}`;
    }
    if (cur === "USD") return `$${v >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : v.toFixed(2)}`;
    return `${v.toFixed(2)}`;
  };

  const formatSecondary = (t: TickerItem) => {
    if (t.type === "rate" || t.type === "forex" || t.currency === "%") return null;
    if (t.currency === "USD" && t.price_inr) {
      return `≈ ₹${t.price_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
    if (t.currency === "INR" && t.price_usd) {
      return `≈ $${t.price_usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    }
    if (t.currency !== "INR" && t.price_inr) {
      return `≈ ₹${t.price_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
    return null;
  };

  const secondaryText = formatSecondary(item);

  const typeColor: Record<string, string> = {
    index: "text-blue-500 bg-blue-500/10",
    crypto: "text-violet-500 bg-violet-500/10",
    forex: "text-amber-500 bg-amber-500/10",
    commodity: "text-orange-500 bg-orange-500/10",
    rate: "text-emerald-500 bg-emerald-500/10",
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-border/60 bg-card/60 hover:border-primary/30 hover:bg-card transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full", typeColor[item.type] || "text-muted-foreground bg-muted")}>{item.type}</span>
          <span className="text-[10px] font-mono text-muted-foreground">{item.symbol}</span>
        </div>
        {item.type !== "rate" && (
          <div className={cn("flex items-center gap-0.5 text-[10px] font-bold", isUp ? "text-emerald-500" : "text-red-500")}>
            {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {isUp ? "+" : ""}{item.change_pct.toFixed(2)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-bold text-foreground leading-tight">{formatPrice(item.price, item.currency)}</p>
        {secondaryText && (
          <p className="text-[10px] text-muted-foreground">{secondaryText}</p>
        )}
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.label}</p>
      </div>

      {/* Sparkline */}
      {item.type !== "rate" && (
        <div className="h-8 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={isUp ? "#10b981" : "#ef4444"}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function MarketPanel() {
  const { data: markets } = useMarketData();
  const { data: macro } = useMacroPulse();

  if (!markets) return null;

  const categories = {
    "🇮🇳 Indian Markets": markets.tickers.filter(t => ["SENSEX", "NIFTY50", "BANKNIFTY"].includes(t.symbol)),
    "🌐 Global Indices": markets.tickers.filter(t => ["SPX", "NASDAQ", "FTSE"].includes(t.symbol)),
    "₿ Crypto": markets.tickers.filter(t => t.type === "crypto"),
    "💱 Forex (per 1 unit → ₹)": markets.tickers.filter(t => t.type === "forex"),
    "🏗️ Commodities": markets.tickers.filter(t => t.type === "commodity"),
  };

  const sentimentColor = macro?.overall_sentiment?.includes("optimistic")
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : macro?.overall_sentiment?.includes("bearish")
    ? "text-red-500 bg-red-500/10 border-red-500/20"
    : "text-amber-500 bg-amber-500/10 border-amber-500/20";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Global Market Intelligence</span>
        </div>
        <div className="flex items-center gap-2">
          {macro && (
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", sentimentColor)}>
              {macro.overall_sentiment.replace(/_/g, " ")}
            </span>
          )}
          <span className="text-[9px] text-muted-foreground font-mono">USD/INR: ₹{markets.usdinr.toFixed(2)}</span>
        </div>
      </div>

      {/* Market grids by category */}
      {Object.entries(categories).map(([label, tickers]) => (
        <div key={label}>
          <p className="text-[10px] font-semibold text-muted-foreground mb-2">{label}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {tickers.map(t => <TickerCard key={t.symbol} item={t} />)}
          </div>
        </div>
      ))}

      {/* Macro News Feed */}
      {macro && macro.news.length > 0 && (
        <Card className="p-4 border border-border/60 bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Macro Intelligence Feed</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {macro.news.map((n, i) => (
              <div key={i} className={cn(
                "flex items-start gap-2 p-2 rounded-lg border text-[11px]",
                n.sentiment === "positive" ? "border-emerald-500/20 bg-emerald-500/5"
                : n.sentiment === "negative" ? "border-red-500/20 bg-red-500/5"
                : "border-border/50 bg-muted/20"
              )}>
                {n.sentiment === "positive"
                  ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                  : n.sentiment === "negative"
                  ? <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                  : <Globe className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                }
                <div className="min-w-0">
                  <p className="font-medium text-foreground leading-snug">{n.headline}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{n.source} · {n.impact}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Central bank rates */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/40">
            {[
              { label: "RBI Repo", val: `${macro.central_bank_rates.rbi_repo}%` },
              { label: "US Fed", val: `${macro.central_bank_rates.us_fed}%` },
              { label: "ECB", val: `${macro.central_bank_rates.ecb}%` },
              { label: "India CPI", val: `${macro.inflation.india_cpi}%` },
            ].map(r => (
              <div key={r.label} className="text-center p-1.5 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-[9px] text-muted-foreground">{r.label}</p>
                <p className="text-xs font-bold text-foreground">{r.val}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
