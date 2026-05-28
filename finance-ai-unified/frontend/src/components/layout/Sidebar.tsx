import { Link, useRouterState } from "@tanstack/react-router";
import { useFinanceStore } from "@/lib/store";
import { useFiles, useFile, useAnalysis } from "@/lib/api";
import {
  LayoutDashboard,
  FileText,
  Activity,
  Receipt,
  CalendarDays,
  CalendarRange,
  Tag,
  Bot,
  Bell,
  ChevronLeft,
  ChevronRight,
  Upload,
  Database,
  FolderOpen,
  RefreshCw,
  MessageSquare,
  Workflow,
  Briefcase,
  HeartPulse,
  Search,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Scale,
  BookOpen,
  BrainCircuit,
  Target,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// ─── Nav structure matching reference design ────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { id: "dashboard",     to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
      { id: "brief",         to: "/brief",         icon: FileText,         label: "Daily brief" },
      { id: "health",        to: "/health",        icon: Activity,         label: "Health score" },
      { id: "board-package", to: "/board-package", icon: Briefcase,        label: "Board package" },
    ],
  },
  {
    label: "Markets & Intelligence",
    items: [
      { id: "research",    to: "/research",    icon: Search,      label: "Market Research" },
      { id: "treasury",    to: "/treasury",    icon: DollarSign,  label: "Treasury & FX" },
      { id: "compliance",  to: "/compliance",  icon: Scale,       label: "Compliance & Tax" },
    ],
  },
  {
    label: "Data",
    items: [
      { id: "transactions", to: "/transactions", icon: Receipt,       label: "Transactions", badgeKey: "txCount" },
      { id: "invoices",     to: "/invoices",     icon: BookOpen,      label: "Invoice AI" },
      { id: "vendors",      to: "/vendors",      icon: Target,        label: "Vendor Intel" },
      { id: "reconcile",    to: "/reconcile",    icon: RefreshCw,     label: "Reconciliation" },
      { id: "scenarios",    to: "/scenarios",    icon: TrendingUp,    label: "Scenario War Room" },
      { id: "daily",        to: "/daily",        icon: CalendarDays,  label: "Daily spending" },
      { id: "monthly",      to: "/monthly",      icon: CalendarRange, label: "Monthly" },
      { id: "categories",   to: "/categories",   icon: Tag,           label: "Categories" },
    ],
  },
  {
    label: "AI Agents",
    items: [
      {
        id: "agents",
        to: "/agents",
        icon: Bot,
        label: "All agents",
        subItems: [
          { id: "research-ai",   to: "/agents/research",   icon: Search,       label: "Research AI" },
          { id: "planning",      to: "/agents/planning",   icon: TrendingUp,   label: "Planning AI" },
          { id: "accounting",    to: "/agents/accounting", icon: ShieldCheck,  label: "Accounting AI" },
          { id: "treasury-ai",   to: "/agents/treasury",   icon: DollarSign,   label: "Treasury AI" },
          { id: "compliance-ai", to: "/agents/compliance", icon: Scale,        label: "Compliance AI" },
          { id: "reporting",     to: "/agents/reporting",  icon: BookOpen,     label: "Reporting AI" },
          { id: "decision",      to: "/agents/decision",   icon: BrainCircuit, label: "Decision AI" },
        ],
      },
      { id: "signals",       to: "/signals",       icon: Bell,          label: "Signals", badgeKey: "signalCount" },
      { id: "query",         to: "/query",         icon: MessageSquare, label: "CFO Query" },
      { id: "workflows",     to: "/workflows",     icon: Workflow,      label: "Workflows" },
      { id: "module-health", to: "/module-health", icon: HeartPulse,    label: "Module health" },
    ],
  },
];


export function Sidebar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const currentFileId    = useFinanceStore((s) => s.currentFileId);
  const setCurrentFileId = useFinanceStore((s) => s.setCurrentFileId);

  useEffect(() => {
    const nav = navRef.current;
    if (nav) {
      const savedScroll = sessionStorage.getItem("sidebar-scroll");
      if (savedScroll) {
        nav.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }, [pathname]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    sessionStorage.setItem("sidebar-scroll", e.currentTarget.scrollTop.toString());
  };

  const { data: fileData }  = useFile(currentFileId);
  const { data: allFiles }  = useFiles();
  const activeFile          = fileData?.metadata;

  // Badge data
  const latestAnalysisSummary = fileData?.analyses?.[0];
  const { data: analysisData } = useAnalysis(latestAnalysisSummary?.id || null);
  const signalCount = analysisData?.result?.composite_patterns?.length ?? 0;
  const txCount     = fileData?.metadata?.tx_count ?? 0;

  const badges: Record<string, number> = { txCount, signalCount };

  const isActive = (to: string) => {
    if (to === "/dashboard") return pathname === "/dashboard";
    if (to === "/agents")    return pathname === "/agents";
    return pathname === to || pathname.startsWith(to + "/");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border/60 bg-card/70 backdrop-blur-md transition-all duration-300 ease-in-out z-30",
        isCollapsed ? "w-[60px]" : "w-[200px]"
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground hover:scale-105 transition-transform z-50"
      >
        {isCollapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft  className="h-3 w-3" />
        }
      </button>

      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 p-4 border-b border-border/50 min-h-[56px]", isCollapsed && "justify-center px-2")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-violet-500 text-primary-foreground shadow shadow-primary/30">
          <Bot className="h-4 w-4" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-tight text-foreground truncate">Finance AI</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">Chief Command</p>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-none py-3 px-2 space-y-4"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon    = item.icon;
                const active  = isActive(item.to);
                const badge   = item.badgeKey ? badges[item.badgeKey] : undefined;

                return (
                  <div key={item.id} className="flex flex-col">
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all group",
                        isCollapsed && "justify-center px-2",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={cn("h-[15px] w-[15px] shrink-0 transition-transform group-hover:scale-110", active && "text-primary")} />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge !== undefined && badge > 0 && (
                            <span className={cn(
                              "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                              item.id === "signals"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-success/15 text-success"
                            )}>
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>

                    {/* Nested Submenu for Separate AIs */}
                    {item.subItems && !isCollapsed && (
                      <div className="mt-0.5 pl-3 border-l border-border/40 ml-[17px] space-y-0.5 flex flex-col mb-1.5">
                        {item.subItems.map((sub) => {
                          const SubIcon = sub.icon;
                          const subActive = isActive(sub.to);
                          return (
                            <Link
                              key={sub.id}
                              to={sub.to}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all group/sub",
                                subActive
                                  ? "text-primary bg-primary/5 font-semibold"
                                  : "text-muted-foreground hover:bg-accent/55 hover:text-foreground"
                              )}
                            >
                              <SubIcon className={cn("h-3.5 w-3.5 shrink-0 transition-transform group-hover/sub:scale-110", subActive && "text-primary")} />
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: active workspace + file switcher */}
      <div className={cn("border-t border-border/50 bg-card/40 p-3", isCollapsed && "flex justify-center p-2")}>
        {isCollapsed ? (
          <Database className="h-4 w-4 text-muted-foreground" />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                <Database className="h-3 w-3 text-primary" /> Workspace
              </span>
              {currentFileId && allFiles && allFiles.length > 0 && (
                <button
                  onClick={() => { const l = allFiles[0]?.id; if (l) setCurrentFileId(l); }}
                  title="Switch to latest file"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}
            </div>

            {activeFile ? (
              <div className="rounded-lg border border-border bg-background/50 p-2 space-y-0.5">
                <div className="flex items-start gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold truncate text-foreground leading-tight" title={activeFile.original_name}>
                      {activeFile.original_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {activeFile.tx_count} txns · {activeFile.currency}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-2 text-center">
                <p className="text-[11px] text-muted-foreground font-medium">No data loaded</p>
                <Link to="/dashboard" className="text-[10px] text-primary hover:underline font-semibold mt-1 block">
                  Go to Dashboard
                </Link>
              </div>
            )}

            {allFiles && allFiles.length > 1 && (
              <select
                value={currentFileId || ""}
                onChange={(e) => setCurrentFileId(e.target.value || null)}
                className="w-full text-[11px] bg-background/40 border border-border/80 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
              >
                <option value="">— Switch file —</option>
                {allFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.original_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input for upload trigger */}
      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden" />
    </aside>
  );
}
