import { Sidebar } from "./Sidebar";
import { useQuery } from "@tanstack/react-query";
import { api, useFile, useAnalysis } from "@/lib/api";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useFinanceStore } from "@/lib/store";
import { FileUploadModal } from "./FileUploadModal";
import { MarketTicker } from "@/components/dashboard/MarketTicker";
import {
  Activity, Cpu, Upload, Sun, Moon, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

// ── Breadcrumb labels ───────────────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  "":              "Dashboard",
  "dashboard":     "Dashboard",
  "brief":         "Daily Brief",
  "health":        "Health Score",
  "transactions":  "Transactions",
  "daily":         "Daily Spending",
  "monthly":       "Monthly",
  "categories":    "Categories",
  "agents":        "AI Agents",
  "signals":       "Signals",
  "settings":      "Settings",
  "history":       "History",
  "query":         "CFO Advisor Chat",
  "workflows":     "Agent Workflows",
  "module-health": "Module Health Control",
  "board-package": "Board Intelligence",
};

export function AppLayout({ children }: AppLayoutProps) {
  const routerState  = useRouterState();
  const navigate     = useNavigate();
  const pathname     = routerState.location.pathname;

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  const currentFileId    = useFinanceStore((s) => s.currentFileId);
  const { data: fileData } = useFile(currentFileId);
  const latestAnalysis     = fileData?.analyses?.[0];
  const { data: analysisData } = useAnalysis(latestAnalysis?.id || null);
  const signalCount = analysisData?.result?.composite_patterns?.length ?? 0;

  // Sync theme with HTML class
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  // API health
  const { data: healthData, isError } = useQuery({
    queryKey: ["api-health"],
    queryFn:  () => api.getHealth(),
    refetchInterval: 15000,
  });
  const isOnline = !isError && healthData?.status === "ok";

  // Breadcrumbs
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.length === 0
    ? [{ label: "Dashboard", to: "/dashboard" }]
    : parts.map((p, i) => ({
        label: ROUTE_LABELS[p] ?? (p.charAt(0).toUpperCase() + p.slice(1)),
        to: "/" + parts.slice(0, i + 1).join("/"),
      }));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border/60 bg-card/50 backdrop-blur-md px-5 z-20">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="text-muted-foreground/50 font-medium">Finance AI</span>
            {crumbs.map((bc, idx) => (
              <span key={bc.to} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                <span
                  className={cn(
                    "font-medium",
                    idx === crumbs.length - 1
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  )}
                  onClick={() => navigate({ to: bc.to })}
                >
                  {bc.label}
                </span>
              </span>
            ))}
          </div>

          {/* Right: Status + Theme + Signals + Upload */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-secondary text-foreground hover:bg-accent transition-colors"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? (
                <Moon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-amber-400 hover:text-amber-300" />
              )}
            </button>

            {/* Agent / Signals pill */}
            {signalCount > 0 ? (
              <div
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive cursor-pointer hover:bg-destructive/15 transition-colors"
                onClick={() => navigate({ to: "/signals" })}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                {signalCount} signal{signalCount !== 1 ? "s" : ""} active
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                All 8 agents live
              </div>
            )}

            {/* API status */}
            <div className={cn(
              "hidden md:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              isOnline
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            )}>
              <Activity className={cn("h-3 w-3", isOnline && "animate-pulse")} />
              <span>API {isOnline ? "ONLINE" : "OFFLINE"}</span>
            </div>

            {/* Model badge */}
            {healthData?.model && (
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/60">
                <Cpu className="h-3 w-3 text-violet-500" />
                <span className="max-w-[110px] truncate">{healthData.model}</span>
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent hover:border-primary/40 transition-all"
            >
              <Upload className="h-3 w-3" />
              Upload
            </button>
          </div>
        </header>

        {/* ── Market Ticker ────────────────────────────────────────────── */}
        <MarketTicker />

        {/* ── Main Content ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-background p-6 relative">
          {/* Background accent orbs */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-500/3 rounded-full blur-3xl pointer-events-none" />
          {children}
        </main>
      </div>

      <FileUploadModal open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  );
}
