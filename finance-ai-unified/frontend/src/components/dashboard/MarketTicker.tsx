import { useMarketData, MarketTicker as TickerItem } from "@/lib/api";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

function TickerChip({ item }: { item: TickerItem }) {
  const isUp = item.direction === "up";
  const isRate = item.type === "rate";

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
      const v = t.price_inr;
      if (v >= 10_000_000) return `≈ ₹${(v / 10_000_000).toFixed(2)}Cr`;
      if (v >= 100_000) return `≈ ₹${(v / 100_000).toFixed(2)}L`;
      if (v >= 1_000) return `≈ ₹${(v / 1_000).toFixed(1)}K`;
      return `≈ ₹${v.toFixed(2)}`;
    }
    if (t.currency === "INR" && t.price_usd) {
      const v = t.price_usd;
      return `≈ $${v >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : v.toFixed(2)}`;
    }
    if (t.currency !== "INR" && t.price_inr) {
      const v = t.price_inr;
      if (v >= 10_000_000) return `≈ ₹${(v / 10_000_000).toFixed(2)}Cr`;
      if (v >= 100_000) return `≈ ₹${(v / 100_000).toFixed(2)}L`;
      if (v >= 1_000) return `≈ ₹${(v / 1_000).toFixed(1)}K`;
      return `≈ ₹${v.toFixed(2)}`;
    }
    return null;
  };

  const secondaryText = formatSecondary(item);

  return (
    <div className="flex items-center gap-2 shrink-0 px-3 border-r border-border/40 last:border-none">
      <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wide">{item.symbol}</span>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[11px] font-bold text-foreground">
          {formatPrice(item.price, item.currency)}
        </span>
        {secondaryText && (
          <span className="text-[9px] text-muted-foreground">{secondaryText}</span>
        )}
      </div>
      {!isRate && (
        <div className={cn("flex items-center gap-0.5", isUp ? "text-emerald-500" : "text-red-500")}>
          {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
          <span className="text-[10px] font-bold">{isUp ? "+" : ""}{item.change_pct.toFixed(2)}%</span>
        </div>
      )}
    </div>
  );
}

export function MarketTicker() {
  const { data, isError } = useMarketData();

  if (isError || !data) return null;

  const tickers = data.tickers;

  return (
    <div className="w-full h-8 bg-card/80 border-b border-border/50 flex items-center overflow-hidden relative shrink-0">
      {/* Status badge */}
      <div className={cn(
        "shrink-0 flex items-center gap-1.5 px-3 h-full border-r border-border/50 text-[9px] font-bold uppercase tracking-widest",
        data.market_status === "open" ? "text-emerald-500 bg-emerald-500/5" : "text-amber-500 bg-amber-500/5"
      )}>
        <span className={cn("h-1.5 w-1.5 rounded-full", data.market_status === "open" ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
        {data.market_status === "open" ? "Live" : "After Hours"}
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden">
        <div className="flex animate-[marquee_60s_linear_infinite] hover:[animation-play-state:paused]">
          {/* Duplicate for seamless loop */}
          {[...tickers, ...tickers].map((item, i) => (
            <TickerChip key={`${item.symbol}-${i}`} item={item} />
          ))}
        </div>
      </div>

      {/* Refresh indicator */}
      <div className="shrink-0 px-3 border-l border-border/50 flex items-center">
        <Activity className="h-2.5 w-2.5 text-muted-foreground/50 animate-pulse" />
      </div>
    </div>
  );
}
