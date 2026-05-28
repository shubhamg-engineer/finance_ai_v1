import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFile, useAnalysis, useTrackedCompanies, apiExt } from "@/lib/api";
import { useFinanceStore } from "@/lib/store";
import {
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  Search,
  BookOpen,
  DollarSign,
  Scale,
  ArrowLeft,
  Calendar,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Building,
  FileText,
  Activity,
  Play,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Zap,
  Mail,
  Lock,
  Unlock,
  CheckCircle2,
  Bookmark,
  Sparkles,
  RefreshCw,
  Sliders,
  DollarSign as CashIcon,
  ShieldQuestion,
  Terminal,
  Trash2,
  Plus,
  Link2,
  Loader2,
  Bot,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/agents/$agentId")({
  component: AgentDashboardPage,
});

const AGENT_META: Record<
  string,
  { name: string; icon: any; color: string; desc: string; accent: string }
> = {
  research: {
    name: "Research AI",
    icon: Search,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    accent: "blue",
    desc: "Ingests external macro trends, capital yields index feeds, and analyzes strategic industry opportunities.",
  },
  planning: {
    name: "Planning AI",
    icon: TrendingUp,
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    accent: "emerald",
    desc: "Runs rolling time-series projections, runway burn-rates, and multi-variable scenario models.",
  },
  accounting: {
    name: "Accounting AI",
    icon: ShieldCheck,
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    accent: "red",
    desc: "Flags ledger anomalies, double billing patterns, cost center errors, and automates closing gates.",
  },
  treasury: {
    name: "Treasury AI",
    icon: DollarSign,
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    accent: "amber",
    desc: "Aggregates multi-account balances, tracks receivables aging curves, and optimizes cash yield reserves.",
  },
  compliance: {
    name: "Compliance AI",
    icon: Scale,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    accent: "purple",
    desc: "Monitors RBI/SEBI calendars, GSTR tax obligations, and runs document compliance checkers.",
  },
  reporting: {
    name: "Reporting AI",
    icon: BookOpen,
    color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    accent: "pink",
    desc: "Plots growth-cost variance, calculates fintech CAC ratios, and exports premium boardroom summaries.",
  },
  decision: {
    name: "Decision AI",
    icon: BrainCircuit,
    color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    accent: "violet",
    desc: "Orchestrates composites on a 4x4 risk quadrant and aligns founder priorities with high-scoring actions.",
  },
};

function AgentDashboardPage() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();

  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const { data: fileData, isLoading } = useFile(currentFileId);

  const activeAnalysisSummary = fileData?.analyses?.[0]; // Get latest analysis
  const { data: analysisData } = useAnalysis(activeAnalysisSummary?.id || null);
  const results = analysisData?.result;
  const meta = AGENT_META[agentId] || Object.values(AGENT_META)[0];
  const AgentIcon = meta?.icon || Search;

  const qc = useQueryClient();
  const { data: companies, isLoading: loadingCompanies } = useTrackedCompanies();
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [submittingCompany, setSubmittingCompany] = useState(false);
  const [expandedCompany, setExpandedCompany] = useState<Record<string, boolean>>({});

  const toggleCompanyExpand = (id: string) => {
    setExpandedCompany(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTrackCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSubmittingCompany(true);
    try {
      await apiExt.trackCompany({ name: companyName.trim(), url: companyUrl.trim() || undefined });
      toast.success(`Scraped & analyzed ${companyName} successfully`);
      setCompanyName("");
      setCompanyUrl("");
      qc.invalidateQueries({ queryKey: ["tracked-companies"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to track and scrape company");
    } finally {
      setSubmittingCompany(false);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!window.confirm(`Stop tracking and delete AI research for ${name}?`)) return;
    try {
      await apiExt.deleteTrackedCompany(id);
      toast.success(`Removed ${name} from tracked companies`);
      qc.invalidateQueries({ queryKey: ["tracked-companies"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete company");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // AUTOPILOT / AUTO MODE STATES
  // ───────────────────────────────────────────────────────────────────────────
  const [autoMode, setAutoMode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [autoLogs, setAutoLogs] = useState<string[]>([]);

  // ───────────────────────────────────────────────────────────────────────────
  // INTERACTIVE STATES FOR THE 7 SPECIALIST AGENTS
  // ───────────────────────────────────────────────────────────────────────────

  // 1. Research AI States
  const [selectedSector, setSelectedSector] = useState("Wealthtech");
  const [interestTrend, setInterestTrend] = useState("rising");
  const [simulatedResearch, setSimulatedResearch] = useState<any>(null);
  const [researchTab, setResearchTab] = useState<"ticker" | "nlp" | "amfi">("ticker");
  const [bondYield, setBondYield] = useState(7.14);
  const [niftyIndex, setNiftyIndex] = useState(22950);
  const [vixIndex, setVixIndex] = useState(13.4);
  const [goldPrice, setGoldPrice] = useState(72800);
  const [macroMultiplier, setMacroMultiplier] = useState(1.0);

  // 2. Planning AI States
  const [planningTab, setPlanningTab] = useState<"scenario" | "budget" | "pitch">("scenario");
  const [scenarioCase, setScenarioCase] = useState<"base" | "best" | "worst">("base");
  const [opexSpike, setOpexSpike] = useState(15);
  const [reinvestmentRate, setReinvestmentRate] = useState(30);
  const [projectedMonths, setProjectedMonths] = useState<any[]>([]);

  // 3. Accounting AI States
  const [accountingTab, setAccountingTab] = useState<"ledger" | "ap" | "gst" | "close">("ledger");
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [apBudget, setApBudget] = useState(150000);
  const [optimizedPayments, setOptimizedPayments] = useState<any[]>([]);
  const [selectedMismatch, setSelectedMismatch] = useState<any>(null);
  const [gstEmailBody, setGstEmailBody] = useState("");
  const [closeTasks, setCloseTasks] = useState([
    { code: "T-01", label: "Perform Bank Ledger Reconciliation", completed: false },
    { code: "T-02", label: "Clear suspense account entries (GL 59999)", completed: false },
    { code: "T-03", label: "Submit GSTR-2B Input credit matching", completed: false },
    { code: "T-04", label: "Accrue pending B2B vendor payables", completed: false },
  ]);
  const [isPeriodLocked, setIsPeriodLocked] = useState(false);
  const [reconMatchRate, setReconMatchRate] = useState(98.4);
  const [reconGapOffset, setReconGapOffset] = useState(0);

  // 4. Treasury AI States
  const [treasuryTab, setTreasuryTab] = useState<"cash" | "aging" | "debt">("cash");
  const [stressScenario, setStressScenario] = useState("Client Churn Event");
  const [customStressName, setCustomStressName] = useState("");
  const [customOutflow, setCustomOutflow] = useState(20);
  const [customDelay, setCustomDelay] = useState(15);
  const [stressResult, setStressResult] = useState<any>(null);
  const [investableReserves, setInvestableReserves] = useState(1000000);

  // 5. Compliance AI States
  const [complianceTab, setComplianceTab] = useState<"calendar" | "ocr" | "risks">("calendar");
  const [auditCheckpoints, setAuditCheckpoints] = useState({
    mca: true,
    tds: false,
    gst: true,
    pf: false,
  });
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrScore, setOcrScore] = useState<number | null>(null);
  const [ocrFileName, setOcrFileName] = useState("");

  // 6. Reporting AI States
  const [reportingTab, setReportingTab] = useState<"ratios" | "variance" | "briefing">("ratios");
  const [boardNarrativeText, setBoardNarrativeText] = useState("");

  // 7. Decision AI States
  const [decisionTab, setDecisionTab] = useState<"matrix" | "tradeoff" | "timeline">("matrix");
  const [appetiteRisk, setAppetiteRisk] = useState(50); // Balanced
  const [growthFocus, setGrowthFocus] = useState(60); // Sustainable

  // Populate dynamic default states based on real CSV database values
  useEffect(() => {
    if (results) {
      // Planning Projections baseline
      const baseline = results.planning?.output?.months_projections || [];
      setProjectedMonths(baseline);

      // Ingested transactions list
      setTransactionsList([
        { id: 101, date: "2026-05-15", desc: "SEBI Compliance Toolkit", amount: 950000, cat: "Professional Fees", gl: "52210", cc: "Legal", risk: "Medium" },
        { id: 102, date: "2026-05-12", desc: "Stellar Cloud Hosting Payout", amount: 45000, cat: "Software & SaaS", gl: "52250", cc: "Infra", risk: "Low" },
        { id: 103, date: "2026-05-09", desc: "HDFC Suspense Posting", amount: 12000, cat: "Uncategorized", gl: "59999", cc: "Unknown", risk: "High" },
        { id: 104, date: "2026-05-02", desc: "AWS Infrastructure Charge", amount: 82000, cat: "Software & SaaS", gl: "52250", cc: "Infra", risk: "Low" },
      ]);

      // Reporting Narrative baseline
      setBoardNarrativeText(results.reporting?.output?.board_narrative || "");

      // Run baseline Treasury Stress Test
      handleRunStressTest();
    }
  }, [results, agentId]);

  // ───────────────────────────────────────────────────────────────────────────
  // ACTION HANDLERS
  // ───────────────────────────────────────────────────────────────────────────

  // Trigger Autopilot (Auto Mode) Pipeline
  const handleToggleAutoMode = () => {
    if (autoMode) {
      setAutoMode(false);
      toast.info("Auto Mode deactivated. Dashboard reverted to manual overrides.");
      return;
    }

    setAutoMode(true);
    setIsSimulating(true);
    setAutoLogs(["[System] Ingesting parameters from active ledger..."]);
    toast.success("Autopilot Mode Activated! Synchronizing all 7 specialist agents...");

    const logSteps = [
      "[Research AI] Reading AMFI mutual fund rates and mapping macro-economic yields...",
      "[Planning AI] Compiling base, best, and worst scenarios with dynamic cash paces...",
      "[Accounting AI] Running z-score categorization engines and AP payment selectors...",
      "[Treasury AI] Aligning multi-account reserve balances and cash outflows...",
      "[Compliance AI] Scanning compliance calendars and checking tax filing statuses...",
      "[Reporting AI] Compiling EBITDA metrics and variance analysis brief...",
      "[Decision AI] Modeling strategic quadrant variables to generate low-risk decisions...",
      "[System] Auto-Mode Synchronization complete. All specialist systems nominal."
    ];

    logSteps.forEach((step, idx) => {
      setTimeout(() => {
        setAutoLogs(prev => [...prev, step]);
        if (idx === logSteps.length - 1) {
          setIsSimulating(false);
          toast.success("All 7 Specialist AI Agents synchronized successfully!");

          // Auto-tune parameters dynamically based on active agent
          if (agentId === "research") {
            setSelectedSector("SaaS Platform");
            setInterestTrend("falling");
            setMacroMultiplier(1.15);
            setBondYield(6.92);
            setNiftyIndex(23410);
            setSimulatedResearch({
              summary: "Under a falling interest rate scenario, SaaS platform sectors enjoy lower capital hurdles. Expected valuation metrics expand by +18.2%.",
              opps: [
                "Deploy ₹15L idle capital into corporate FD yielding 7.25% short-term.",
                "Acquire additional liquid bond yields to hedge medium-term opex pacing."
              ],
              hedging: "Recommendation: Secure 90 days operating opex buffer immutably."
            });
          } else if (agentId === "planning") {
            setOpexSpike(12);
            setReinvestmentRate(45);
            setScenarioCase("best");
            toast.info("Rolling time-series projection charts updated dynamically!");
          } else if (agentId === "accounting") {
            setTransactionsList(prev => prev.map(t => ({ ...t, gl: "52250", risk: "Low", cat: "Software & SaaS" })));
            setApBudget(180000);
            setReconMatchRate(99.8);
            setOptimizedPayments([
              { vendor: "Stellar Infra", amount: 45000, discount: 1500, code: "INV-582" },
              { vendor: "AWS Cloud", amount: 15000, discount: 500, code: "INV-229" }
            ]);
            setCloseTasks(prev => prev.map(t => ({ ...t, completed: true })));
            setIsPeriodLocked(true);
          } else if (agentId === "treasury") {
            setStressScenario("Client Churn Event");
            setCustomStressName("Advisory drop contraction");
            setCustomOutflow(10);
            setCustomDelay(8);
            setInvestableReserves(1500000);
          } else if (agentId === "compliance") {
            setAuditCheckpoints({ mca: true, tds: true, gst: true, pf: true });
            setOcrFileName("Q2_Statutory_GST_Filing.pdf");
            setOcrScore(96);
          } else if (agentId === "reporting") {
            toast.info("Executive KPI scoreboard variance indicators verified.");
          } else if (agentId === "decision") {
            setAppetiteRisk(32); // Safe
            setGrowthFocus(78); // Sustainable growth
          }
        }
      }, (idx + 1) * 500);
    });
  };

  // 1. Research Sector Simulation
  const handleSimulateSector = () => {
    toast.info(`Simulating macro outcomes for ${selectedSector}...`);
    setTimeout(() => {
      setSimulatedResearch({
        summary: `Under a **${interestTrend}** interest rate outlook, the ${selectedSector} sector will face moderate valuation index adjustments. Cash allocation priority remains defensive.`,
        opps: [
          `Target HNI platform advisory fee allocations to capture yield spreads.`,
          `Pivot capital inflows to low-exposure cash-backed liquid reserves.`
        ],
        hedging: `Recommendation: Establish a cash hedge buffer matching 90 days of opex.`
      });
      toast.success("Sector simulation model calculated successfully!");
    }, 600);
  };

  // 2. Planning Re-calculation
  const handlePlanningRecalc = () => {
    if (!projectedMonths.length) return;
    toast.loading("FP&A forecasting models processing...");
    setTimeout(() => {
      const multiplier = 1 + opexSpike / 100;
      const revGrowth = 1 + reinvestmentRate / 400;
      const updated = projectedMonths.map((m) => ({
        ...m,
        expenses: Math.round(m.expenses * multiplier),
        revenue: Math.round(m.revenue * revGrowth),
      }));
      setProjectedMonths(updated);
      toast.dismiss();
      toast.success("12-Month outlook projections updated dynamically!");
    }, 600);
  };

  // 3. Accounting Ledger Override & Auto-Categorization
  const handleAutoCategorize = (txId: number) => {
    toast.success(`Transaction #${txId} resolved. GL categorizations matched at 98.4% confidence.`);
    setTransactionsList((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, gl: "52250", risk: "Low", cat: "Software & SaaS" } : t))
    );
  };

  const handleManualOverride = (txId: number) => {
    const gl = prompt("Enter override GL Account Code:");
    if (!gl) return;
    toast.success(`Immutable adjustment record posted in ledger audit trail.`);
    setTransactionsList((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, gl, risk: "Low", cat: "Manual Verified" } : t))
    );
  };

  // 3b. Knapsack AP optimizer
  const handleOptimizeAP = () => {
    const invoices = [
      { vendor: "SEBI Legal", amount: 95000, discount: 2000, code: "INV-928" },
      { vendor: "Stellar Infra", amount: 45000, discount: 1500, code: "INV-582" },
      { vendor: "Zerodha Platform", amount: 82000, discount: 3000, code: "INV-091" },
      { vendor: "AWS Cloud", amount: 15000, discount: 500, code: "INV-229" },
    ];
    let budget = apBudget;
    const selected = [];
    const sorted = [...invoices].sort((a, b) => b.discount / b.amount - a.discount / a.amount);
    for (const inv of sorted) {
      if (budget >= inv.amount) {
        selected.push(inv);
        budget -= inv.amount;
      }
    }
    setOptimizedPayments(selected);
    toast.success(`Knapsack optimizer compiled ${selected.length} invoice allocations to pay!`);
  };

  // 3c. GST warning drafter
  const handleSelectMismatch = (mismatch: any) => {
    setSelectedMismatch(mismatch);
    setGstEmailBody(
      `Subject: URGENT: Mismatch filed in GSTR-1 for Invoice ${mismatch.invoice || "N/A"}\n\nDear Supplier,\n\nWe noticed a GSTR-2B Input Credit reconciliation mismatch regarding GSTR-1 filings. Invoice: ${mismatch.invoice}. Mismatch Amount: ₹${mismatch.amount.toLocaleString()}.\n\nPlease upload this details immediately or we will hold future payables.\n\nRegards,\nFinance Team.`
    );
  };

  // 4. Treasury Stress Tester
  const handleRunStressTest = () => {
    const cash = results?.kpis?.cash_on_hand || 1645000;
    const opexMultiplier = 1 + (customStressName ? customOutflow / 100 : 0.15);
    const delayDays = customStressName ? customDelay : 12;

    const baselineCash = cash;
    const stressedCash = Math.round(cash * (1 - (opexMultiplier - 1) - (delayDays / 90)));
    const survivalDays = Math.max(15, Math.round((stressedCash / (results?.kpis?.monthly_burn || 330000)) * 30));

    setStressResult({
      scenarioName: customStressName || stressScenario,
      baselineCash,
      stressedCash,
      survivalDays,
      wcLineNeeded: Math.max(0, 500000 - stressedCash),
      breached: survivalDays < 90,
    });

    if (customStressName) {
      toast.success(`Custom Scenario "${customStressName}" simulated!`);
    }
  };

  // 5. Compliance Document Scanning
  const handleSimulateDocumentOcr = () => {
    setIsOcrScanning(true);
    setOcrFileName("Statutory_MCA_Audit_Filing_2026.pdf");
    toast.loading("Reading document OCR streams...");
    setTimeout(() => {
      setIsOcrScanning(false);
      setOcrScore(92);
      toast.dismiss();
      toast.success("Document verified successfully. MCA compliance score: 92/100!");
    }, 1500);
  };

  // UI Checks
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center space-y-2">
            <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Ingesting active ledger databases...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!results) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-md mx-auto px-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold">No Analysis Database Found</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Please run the AI CFO Pipeline on the Dashboard before viewing individual sub-agent panels.
          </p>
          <Link to="/dashboard" className="mt-4">
            <Button size="sm">Go to Dashboard</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const backendKey = agentId;
  const rawAgentData = results[backendKey as keyof typeof results] as any;
  const agentOutput = rawAgentData?.output || {};

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Link & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/50 pb-5">
          <div className="space-y-1">
            <Link
              to="/agents"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-medium mb-2 group transition-colors"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Back to Agents
            </Link>
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border transition-all duration-300", meta.color, autoMode && "scale-105 ring-2 ring-primary/40")}>
                <AgentIcon className={cn("h-5 w-5", autoMode && "animate-pulse")} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{meta.name}</h1>
                  {autoMode && (
                    <Badge className="bg-gradient-to-r from-primary to-violet-500 text-primary-foreground border-none font-bold text-[9px] animate-pulse">
                      <Zap className="h-2.5 w-2.5 mr-0.5 fill-current" /> AUTOPILOT ACTIVE
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{meta.desc}</p>
              </div>
            </div>
          </div>

          {/* Controls (Quick switch & Pulsing Autopilot) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto Mode Pulsing Toggle */}
            <button
              onClick={handleToggleAutoMode}
              className={cn(
                "flex items-center gap-2 h-9 px-3.5 text-xs font-bold rounded-lg border transition-all duration-300",
                autoMode
                  ? "bg-gradient-to-r from-primary/20 to-violet-500/20 text-primary border-primary/40 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                  : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40"
              )}
            >
              <Sparkles className={cn("h-4 w-4 text-primary", autoMode && "animate-spin")} />
              <span>{autoMode ? "Deactivate Autopilot" : "Click for Auto Mode"}</span>
            </button>

            {/* Quick Switch Switcher */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60">
              {Object.keys(AGENT_META).map((key) => (
                <button
                  key={key}
                  onClick={() => navigate({ to: `/agents/${key}` })}
                  className={cn(
                    "text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-md transition-all whitespace-nowrap",
                    agentId === key
                      ? "bg-background text-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {AGENT_META[key].name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Autopilot Terminal Logs (Visible in Auto Mode) */}
        {autoMode && (
          <Card className="border-primary/20 bg-black/90 p-4 font-mono text-[11px] leading-relaxed text-emerald-400 space-y-1.5 shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 flex items-center gap-1.5 text-muted-foreground/60 text-[9px] font-sans">
              <Terminal className="h-3.5 w-3.5 text-emerald-500/80" /> LIVE PIPELINE
            </div>
            <div className="flex items-center gap-2 pb-1.5 border-b border-emerald-950/40 text-emerald-500/60 font-sans text-[10px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>ACTIVE COCKPIT STREAM (AUTO-PILOT ACTIVE)</span>
            </div>
            {autoLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-600/60 font-bold">❯</span>
                <span>{log}</span>
              </div>
            ))}
            {isSimulating && (
              <div className="flex items-center gap-1.5 text-muted-foreground animate-pulse mt-1">
                <RefreshCw className="h-3 w-3 animate-spin" /> Ingesting datasets...
              </div>
            )}
          </Card>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            1. RESEARCH AI EXPANDED INTERACTIVE PANEL
            ─────────────────────────────────────────────────────────────────── */}
        {agentId === "research" && (
          <div className="space-y-6">
            {/* Research Tabs */}
            <div className="flex gap-2 border-b border-border/40 pb-2 overflow-x-auto">
              {[
                { id: "ticker", label: "Capital Markets Ticker Board", icon: Activity },
                { id: "nlp", label: "NLP Macro Sentiment", icon: BrainCircuit },
                { id: "amfi", label: "AMFI India Mutual Fund yields", icon: DollarSign },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setResearchTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap",
                      researchTab === tab.id
                        ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                        : "text-muted-foreground bg-muted/40 border-border/60 hover:text-foreground"
                    )}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {researchTab === "ticker" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {/* Market Ingestion Dashboard */}
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {[
                      { name: "RBI Repo Rate", value: "6.50%", sub: "Stable / RBI policy", color: "text-blue-500" },
                      { name: "10Y Bond Yield", value: `${bondYield.toFixed(2)}%`, sub: "Liquidity benchmark", color: "text-amber-500" },
                      { name: "Nifty 50 Index", value: niftyIndex.toLocaleString(), sub: "+0.85% (India Markets)", color: "text-emerald-500" },
                      { name: "India VIX", value: `${vixIndex}%`, sub: "-2.4% volatility index", color: "text-purple-500" },
                    ].map((idx, i) => (
                      <Card key={i} className="p-4 space-y-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{idx.name}</span>
                        <p className={cn("text-lg font-mono font-bold leading-tight", idx.color)}>{idx.value}</p>
                        <span className="text-[9px] text-muted-foreground block">{idx.sub}</span>
                      </Card>
                    ))}
                  </div>

                  {/* Sector Tailwinds Simulator */}
                  <Card className="p-5 space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-blue-500" /> Sector Tailwinds & Volatility Simulator
                    </span>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground font-bold uppercase">Target Sector</label>
                        <select
                          value={selectedSector}
                          onChange={(e) => setSelectedSector(e.target.value)}
                          className="w-full bg-muted border border-border text-xs rounded-md p-2"
                        >
                          <option value="Wealthtech">Wealthtech Enterprise</option>
                          <option value="SaaS Platform">B2B SaaS / Infra</option>
                          <option value="HNI Wealth">HNI Advisory</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground font-bold uppercase">Interest Rate Outlook</label>
                        <select
                          value={interestTrend}
                          onChange={(e) => setInterestTrend(e.target.value)}
                          className="w-full bg-muted border border-border text-xs rounded-md p-2"
                        >
                          <option value="rising">Rising Interest Rates (+50bps)</option>
                          <option value="stable">Stable / Flat</option>
                          <option value="falling">Falling Interest Rates (-25bps)</option>
                        </select>
                      </div>
                    </div>

                    <Button onClick={handleSimulateSector} className="w-full h-8 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white">
                      <Play className="h-3 w-3 mr-1 fill-white" /> Simulate Sector Outcomes
                    </Button>

                    {simulatedResearch && (
                      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs space-y-2 leading-relaxed">
                        <p className="font-semibold text-foreground">{simulatedResearch.summary}</p>
                        <ul className="list-disc pl-4 space-y-1 text-muted-foreground font-medium">
                          {simulatedResearch.opps.map((o: string, i: number) => <li key={i}>{o}</li>)}
                        </ul>
                        <p className="text-blue-500 font-mono text-[10px] font-semibold">{simulatedResearch.hedging}</p>
                      </div>
                    )}
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Opportunities */}
                  <Card className="p-5 border-l-4 border-l-blue-500 space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-blue-500" /> Strategic Opportunities
                    </span>
                    <ul className="space-y-2.5">
                      {(agentOutput.opportunities || [
                        "Target HNI platform advisory fee allocations to capture yield spreads.",
                        "Pivot opex buffers to short-term AAA corporate debt funds."
                      ]).map((opp: string, idx: number) => (
                        <li key={idx} className="text-xs text-foreground/90 flex items-start gap-2 leading-normal font-medium">
                          <span className="h-4 w-4 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            )}

            {researchTab === "nlp" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Natural Language Processing Macro Sentiment</span>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed font-medium">
                  Research AI scans over 1,500 news channels, RBI regulatory publications, and Nifty indexes hourly. Sentiment vectors are parsed using Groq LLM clusters.
                </p>

                <div className="grid gap-6 md:grid-cols-3 pt-2">
                  <div className="p-5 bg-card/60 border border-border/80 rounded-xl text-center space-y-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Aggregated Sentiment</span>
                    <h2 className="text-2xl font-extrabold text-blue-500 capitalize">{agentOutput.market_sentiment || "Bullish / Neutral"}</h2>
                    <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto font-medium">Yield indicators imply moderate valuation growth paces.</p>
                  </div>

                  <div className="md:col-span-2 p-5 bg-card/60 border border-border/80 rounded-xl space-y-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Sentiment Indicators Breakdown</span>
                    <div className="space-y-2.5">
                      {[
                        { label: "RBI Rate Cut Probability", val: 65, color: "bg-blue-500" },
                        { label: "Equity Inflows Index", val: 82, color: "bg-emerald-500" },
                        { label: "Macro Inflation Warnings", val: 28, color: "bg-red-500" },
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                            <span>{item.label}</span>
                            <span>{item.val}%</span>
                          </div>
                          <Progress value={item.val} className={cn("h-1.5 bg-muted", item.color)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {researchTab === "amfi" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">AMFI India Mutual Fund yields Ingestion</span>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Simulated integration with Association of Mutual Funds in India (AMFI) APIs, showing current NAV structures and yield spreads for corporate cash management.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground font-bold text-[10px] uppercase">
                        <th className="py-2.5">Scheme Code</th>
                        <th className="py-2.5">Mutual Fund Scheme</th>
                        <th className="py-2.5">NAV Index</th>
                        <th className="py-2.5">1-Year Yield</th>
                        <th className="py-2.5 text-right">Expense Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {[
                        { code: "119551", name: "HDFC Flexi Cap Fund - Direct Plan", nav: "₹1,425.20", yield: "18.2%", ratio: "0.85%" },
                        { code: "128229", name: "ICICI Prudential Liquid Fund - Growth Plan", nav: "₹342.10", yield: "7.15%", ratio: "0.20%" },
                        { code: "110928", name: "SBI Magnum Ultra Short Duration Fund", nav: "₹4,892.40", yield: "7.45%", ratio: "0.25%" },
                      ].map((scheme, i) => (
                        <tr key={i} className="hover:bg-muted/10">
                          <td className="py-2.5 font-mono text-muted-foreground">{scheme.code}</td>
                          <td className="py-2.5 font-bold text-foreground">{scheme.name}</td>
                          <td className="py-2.5 font-mono">{scheme.nav}</td>
                          <td className="py-2.5 font-mono text-emerald-500 font-bold">{scheme.yield}</td>
                          <td className="py-2.5 font-mono text-right">{scheme.ratio}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            2. PLANNING AI EXPANDED INTERACTIVE PANEL
            ─────────────────────────────────────────────────────────────────── */}
        {agentId === "planning" && (
          <div className="space-y-6">
            {/* Planning Tabs */}
            <div className="flex gap-2 border-b border-border/40 pb-2 overflow-x-auto">
              {[
                { id: "scenario", label: "Rolling Forecast Scenario Cockpit", icon: TrendingUp },
                { id: "budget", label: "Departmental budget utilization", icon: Sliders },
                { id: "pitch", label: "VC fundraising Narrative", icon: Sparkles },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPlanningTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap",
                      planningTab === tab.id
                        ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                        : "text-muted-foreground bg-muted/40 border-border/60 hover:text-foreground"
                    )}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {planningTab === "scenario" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {/* Scenario Toggle Projections Chart */}
                  <Card className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Scenario-Based Rolling Projections</span>
                        <span className="text-[9px] text-muted-foreground">Adjust scenarios to forecast cash runways dynamically.</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/60 max-w-full overflow-x-auto">
                        {(["base", "best", "worst"] as const).map((sc) => (
                          <button
                            key={sc}
                            onClick={() => setScenarioCase(sc)}
                            className={cn(
                              "text-[10px] font-bold px-2.5 py-1 rounded-md transition-all uppercase whitespace-nowrap",
                              scenarioCase === sc
                                ? "bg-background text-foreground shadow-sm border border-border/50"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {sc} Case
                          </button>
                        ))}
                      </div>
                    </div>

                    {projectedMonths.length > 0 ? (
                      <div className="h-[250px] w-full font-mono text-[10px] pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={projectedMonths} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                            <XAxis dataKey="month" stroke="#6b7280" className="font-mono text-[10px]" />
                            <YAxis stroke="#6b7280" className="font-mono text-[10px]" />
                            <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }} />
                            <Area name="Revenue Forecast" type="monotone" dataKey="revenue" stroke="var(--success)" fillOpacity={1} fill="url(#colorRev)" />
                            <Area name="OPEX Forecast" type="monotone" dataKey="expenses" stroke="var(--destructive)" fillOpacity={1} fill="url(#colorExp)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-10">Projections unavailable.</p>
                    )}
                  </Card>

                  {/* Multipliers Form */}
                  <Card className="p-5 space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-emerald-500" /> Multi-variable opex & Reinvestment rate multipliers
                    </span>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>OPEX Expansion Spike</span>
                          <span className="text-primary font-bold">{opexSpike}%</span>
                        </div>
                        <Progress value={opexSpike} className="h-1.5 bg-muted" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={opexSpike}
                          onChange={(e) => setOpexSpike(Number(e.target.value))}
                          className="w-full h-1 cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>Reinvestment Ratio</span>
                          <span className="text-primary font-bold">{reinvestmentRate}%</span>
                        </div>
                        <Progress value={reinvestmentRate} className="h-1.5 bg-muted" />
                        <input
                          type="range"
                          min="10"
                          max="80"
                          value={reinvestmentRate}
                          onChange={(e) => setReinvestmentRate(Number(e.target.value))}
                          className="w-full h-1 cursor-pointer accent-primary"
                        />
                      </div>
                    </div>

                    <Button onClick={handlePlanningRecalc} className="w-full h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
                      Recalculate Projections
                    </Button>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Recommendations */}
                  <Card className="p-5 border-l-4 border-l-emerald-500 space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-emerald-500" /> Strategic Recommendations
                    </span>
                    <ul className="space-y-2.5">
                      {(agentOutput.action_items || [
                        "Optimize SaaS platform opex spike factors by 12%.",
                        "Delay non-essential cost center capex schedules by 30 days."
                      ]).map((item: string, idx: number) => (
                        <li key={idx} className="text-xs text-foreground/90 flex items-start gap-1.5 leading-relaxed font-semibold">
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            )}

            {planningTab === "budget" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Departmental budget utilization pacing (z-score warnings)</span>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Calculates actual pacing paces compared to core budgets. Pacing pacing over 90% triggers high Z-score anomaly warning flags.
                </p>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 pt-2">
                  {[
                    { dept: "Engineering / Cloud", actual: "₹4.50L", budget: "₹5.00L", pct: 90, status: "WARNING" },
                    { dept: "Sales & Marketing", actual: "₹2.20L", budget: "₹3.50L", pct: 62, status: "NOMINAL" },
                    { dept: "Legal & Professional", actual: "₹9.50L", budget: "₹10.00L", pct: 95, status: "WARNING" },
                  ].map((dept, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold">{dept.dept}</span>
                        <Badge variant={dept.status === "WARNING" ? "destructive" : "secondary"} className="text-[9px] font-extrabold">
                          {dept.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                          <span>{dept.actual} / {dept.budget}</span>
                          <span>{dept.pct}%</span>
                        </div>
                        <Progress value={dept.pct} className="h-1 bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {planningTab === "pitch" && (
              <Card className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">VC fundraising investment narrative</span>
                  <Badge variant="outline" className="text-[9px] font-bold text-emerald-500">Groq-powered</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Aggregates net burn rate and operating runways into a clean VC executive pitch statement.
                </p>

                <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 font-sans text-xs space-y-3 leading-relaxed">
                  <h4 className="font-bold text-foreground">Aghron Q2 Enterprise Investment Synthesis:</h4>
                  <p className="text-muted-foreground font-medium">
                    "With an operating revenue net buffer of ₹{(results.kpis?.total_revenue / 100000).toFixed(1)}L and a managed net burn multiple of 1.2x, Aghron stands in the top 15% of sustainable wealthtech platforms. Corporate liquid cash buffers secure an operating runway of over {results.kpis?.runway_months || "12+"} months. Reinvestment structures support high-efficiency product expansion pipelines."
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            3. ACCOUNTING AI EXPANDED INTERACTIVE PANEL
            ─────────────────────────────────────────────────────────────────── */}
        {agentId === "accounting" && (
          <div className="space-y-6">
            {/* Accounting Tabs */}
            <div className="flex gap-2 border-b border-border/40 pb-2 overflow-x-auto">
              {[
                { id: "ledger", label: "Autonomic General Ledger overrides", icon: FileText },
                { id: "ap", label: "Knapsack AP payments optimizer", icon: Sliders },
                { id: "gst", label: "GSTR matches & vendor mismatches", icon: AlertTriangle },
                { id: "close", label: "Month-End Close Lock", icon: Lock },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAccountingTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap",
                      accountingTab === tab.id
                        ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                        : "text-muted-foreground bg-muted/40 border-border/60 hover:text-foreground"
                    )}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {accountingTab === "ledger" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {/* Ledger Overrides Registry */}
                  <Card className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Verifiable General Ledger Registry overrides</span>
                      <Badge variant="outline" className="text-[9px] font-bold">Ledger Cockpit</Badge>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/80 text-muted-foreground font-bold text-[10px] uppercase">
                            <th className="py-2.5">Date</th>
                            <th className="py-2.5">Particulars</th>
                            <th className="py-2.5">GL Code</th>
                            <th className="py-2.5">Cost Center</th>
                            <th className="py-2.5">Amount</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-medium">
                          {transactionsList.map((tx) => (
                            <tr key={tx.id} className="hover:bg-muted/10">
                              <td className="py-2.5 font-mono text-[10px] text-muted-foreground">{tx.date}</td>
                              <td className="py-2.5 font-bold text-foreground">{tx.desc}</td>
                              <td className="py-2.5 font-mono text-primary font-bold">{tx.gl}</td>
                              <td className="py-2.5 text-muted-foreground">{tx.cc}</td>
                              <td className="py-2.5 font-mono">₹{tx.amount.toLocaleString()}</td>
                              <td className="py-2.5 text-right space-x-1.5">
                                <button
                                  onClick={() => handleAutoCategorize(tx.id)}
                                  className="text-[9px] bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 hover:bg-primary/20 transition-all font-semibold"
                                  title="Auto-classify"
                                >
                                  Auto
                                </button>
                                <button
                                  onClick={() => handleManualOverride(tx.id)}
                                  className="text-[9px] bg-muted border border-border rounded px-1.5 py-0.5 hover:bg-accent transition-all font-semibold text-muted-foreground hover:text-foreground"
                                  title="Override GL Account"
                                >
                                  Override
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Match Rate score */}
                  <Card className="p-5 text-center space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Autonomic general ledger matched rate</span>
                    <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-5 shadow-sm">
                      <h2 className="text-3xl font-extrabold text-red-500">{reconMatchRate}%</h2>
                      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed font-medium">Overall ledger matching integrity index compared to bank statements.</p>
                    </div>

                    {/* Gap reconciliator slider */}
                    <div className="space-y-2 text-left pt-2 border-t border-border/40">
                      <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                        <span>Auto-reconciliation gap threshold</span>
                        <span className="text-primary font-bold">₹{reconGapOffset.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="250"
                        value={reconGapOffset}
                        onChange={(e) => {
                          setReconGapOffset(Number(e.target.value));
                          setReconMatchRate(Math.min(99.9, +(98.4 + Number(e.target.value) / 3000).toFixed(1)));
                        }}
                        className="w-full h-1 cursor-pointer accent-primary"
                      />
                    </div>
                  </Card>

                  {/* Anomalies */}
                  <Card className="p-5 space-y-4 border-l-4 border-l-red-500">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-bold text-red-500">Autonomic Fraud & Anomaly Audit Log</span>
                    <ul className="space-y-2.5">
                      {(agentOutput.anomalies || [
                        { id: 103, type: "Suspense Account Mismatch", reason: "GL 59999 posting", severity: "HIGH" }
                      ]).map((item: any, idx: number) => (
                        <li key={idx} className="text-xs text-foreground/90 flex items-start gap-1.5 leading-normal font-semibold">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">{item.type || "Double Payment Flag"}</p>
                            <p className="font-bold">{item.reason || "Suspense posting detected"}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            )}

            {accountingTab === "ap" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Knapsack accounts payable optimizer</span>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Deploy a greedy knapsack algorithm to maximize cash discount returns under strict budget caps.
                </p>

                <div className="flex gap-4 items-center max-w-md pb-2">
                  <span className="text-xs font-bold text-muted-foreground shrink-0">Budget Cap: ₹{apBudget.toLocaleString()}</span>
                  <input
                    type="range"
                    min="50000"
                    max="300000"
                    step="10000"
                    value={apBudget}
                    onChange={(e) => setApBudget(Number(e.target.value))}
                    className="flex-1 cursor-pointer accent-primary"
                  />
                  <Button onClick={handleOptimizeAP} size="sm" className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white">Run Knapsack</Button>
                </div>

                {optimizedPayments.length > 0 && (
                  <div className="space-y-3 border-t border-border/40 pt-4">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block font-bold">Optimized Invoice payment registry dispatch list</span>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {optimizedPayments.map((p, idx) => (
                        <div key={idx} className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-xl space-y-1.5 text-xs font-semibold">
                          <div className="flex justify-between font-bold">
                            <span>{p.vendor}</span>
                            <span className="font-mono text-emerald-500 font-bold">₹{p.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Discount yield:</span>
                            <span className="font-bold text-foreground">₹{p.discount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {accountingTab === "gst" && (
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="p-5 md:col-span-2 space-y-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">GSTR unmatched invoice supplier mismatches (GSTR-2B Mismatch)</span>

                  <div className="space-y-3">
                    {[
                      { supplier: "Khaitan Partners Legal", invoice: "INV/2026/892", amount: 95000, mismatch: "Unreported in vendor GSTR-1" },
                      { supplier: "SEBI Compliance Consultant", invoice: "SEB-0081", amount: 35000, mismatch: "Mismatch in tax rates (accrued 18%, filed 12%)" }
                    ].map((mismatch, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectMismatch(mismatch)}
                        className={cn(
                          "p-3 border rounded-xl text-xs flex justify-between items-center cursor-pointer transition-all font-semibold",
                          selectedMismatch?.invoice === mismatch.invoice
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "border-border/60 hover:bg-muted/10"
                        )}
                      >
                        <div>
                          <p className="font-bold text-foreground">{mismatch.supplier}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{mismatch.mismatch} · Invoice: {mismatch.invoice}</p>
                        </div>
                        <span className="font-mono font-bold text-foreground">₹{mismatch.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {selectedMismatch && (
                  <Card className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="h-4 w-4" /> Supplier Escalation Warning Email
                      </span>
                      <textarea
                        value={gstEmailBody}
                        onChange={(e) => setGstEmailBody(e.target.value)}
                        className="w-full bg-muted border border-border text-[11px] font-mono leading-relaxed rounded-md p-2 h-[180px] focus:outline-none"
                      />
                    </div>
                    <Button onClick={() => toast.success("Escalation email sent. Payment trigger set on hold.")} size="sm" className="w-full h-8 text-xs font-bold">
                      Escalate & Hold Payables
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {accountingTab === "close" && (
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="p-5 md:col-span-2 space-y-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Month-End GAAP Closing Compliance checklist</span>

                  <div className="space-y-3">
                    {closeTasks.map((t) => (
                      <div key={t.code} className="flex justify-between items-center p-3 rounded-xl border border-border/60 bg-muted/10 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            onClick={() => {
                              setCloseTasks((prev) => prev.map((item) => item.code === t.code ? { ...item, completed: !item.completed } : item));
                            }}
                            className={cn("h-4 w-4 cursor-pointer shrink-0 transition-colors", t.completed ? "text-red-500 fill-red-500/10" : "text-muted-foreground")}
                          />
                          <span className={cn("font-semibold", t.completed && "line-through text-muted-foreground")}>{t.label}</span>
                        </div>
                        <Badge variant={t.completed ? "secondary" : "outline"} className="text-[9px] font-bold">
                          {t.completed ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5 flex flex-col justify-between items-center text-center space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Closing Lock Gate</span>
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-primary">
                      {isPeriodLocked ? <Lock className="h-5 w-5 text-red-500" /> : <Unlock className="h-5 w-5 text-emerald-500" />}
                    </div>
                    <h4 className="text-xs font-bold">{isPeriodLocked ? "Accounting Period Locked" : "GL Accounts Unlocked"}</h4>
                    <p className="text-[10px] text-muted-foreground">All checklists must be completed to lock month-end records immutably.</p>
                  </div>

                  <Button
                    onClick={() => {
                      const allDone = closeTasks.every(t => t.completed);
                      if (!allDone) {
                        toast.error("Please complete all checklist items before locking the accounting period!");
                      } else {
                        setIsPeriodLocked(!isPeriodLocked);
                        toast.success(isPeriodLocked ? "Period lock released successfully!" : "Period closed and locked immutably under GAAP-Audit!");
                      }
                    }}
                    variant={isPeriodLocked ? "destructive" : "default"}
                    className="w-full h-8 text-[11px] font-bold"
                  >
                    {isPeriodLocked ? "Release Period Lock" : "Perform Period Lock"}
                  </Button>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            4. TREASURY AI EXPANDED INTERACTIVE PANEL
            ─────────────────────────────────────────────────────────────────── */}
        {agentId === "treasury" && (
          <div className="space-y-6">
            {/* Treasury Tabs */}
            <div className="flex gap-2 border-b border-border/40 pb-2 overflow-x-auto">
              {[
                { id: "cash", label: "Multi-Account Cash balances", icon: FileText },
                { id: "aging", label: "A/R Receivables aging curve", icon: Sliders },
                { id: "debt", label: "Corporate debt amortizations", icon: Scale },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTreasuryTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap",
                      treasuryTab === tab.id
                        ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                        : "text-muted-foreground bg-muted/40 border-border/60 hover:text-foreground"
                    )}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {treasuryTab === "cash" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {/* Account Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {[
                      { name: "HDFC Bank Operating", value: "₹18.25L", status: "OK" },
                      { name: "ICICI Treasury Reserve", value: "₹24.00L", status: "Nominal" },
                      { name: "Stripe Buffer Account", value: "₹1.15L", status: "Buffer Match" },
                    ].map((acct, i) => (
                      <Card key={i} className="p-4 space-y-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{acct.name}</span>
                        <p className="text-lg font-mono font-bold text-foreground leading-tight">{acct.value}</p>
                        <Badge variant="secondary" className="text-[8px] font-extrabold">{acct.status}</Badge>
                      </Card>
                    ))}
                  </div>

                  {/* Stress Tester */}
                  <Card className="p-5 space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Scenario-Based Cash Stress Tester</span>
                        <span className="text-[9px] text-muted-foreground mt-0.5">Stress testing liquid reserves under adverse operating margins</span>
                      </div>

                      <div className="flex gap-2">
                        <select
                          value={stressScenario}
                          onChange={(e) => setStressScenario(e.target.value)}
                          className="bg-muted border border-border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                        >
                          <option value="Client Churn Event">Client Churn Event (-20% rev)</option>
                          <option value="Advisory Drop">Advisory Drop (-15% rev)</option>
                          <option value="Severe Spike">Severe Spike (-30% opex)</option>
                        </select>
                        <Button onClick={handleRunStressTest} size="sm" className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">
                          <Play className="h-3 w-3 mr-1 fill-white" /> Run Test
                        </Button>
                      </div>
                    </div>

                    {stressResult && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-border/40 pt-4 mt-3">
                        <div className="p-3 rounded-lg bg-muted/10 border border-border/70 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase font-semibold">Baseline Reserves</p>
                          <p className="text-xs font-bold text-foreground mt-1 font-mono">₹{(stressResult.baselineCash / 100000).toFixed(2)}L</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/10 border border-border/70 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase font-semibold">Stressed cash</p>
                          <p className="text-xs font-bold mt-1 text-red-500 font-mono">₹{(stressResult.stressedCash / 100000).toFixed(2)}L</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/10 border border-border/70 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase font-semibold">Survival timeline</p>
                          <p className={cn("text-xs font-bold mt-1 font-mono", stressResult.breached ? "text-red-500 animate-pulse" : "text-emerald-500")}>
                            {stressResult.survivalDays} Days
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/10 border border-border/70 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase font-semibold">WC Line Needed</p>
                          <p className="text-xs font-bold text-amber-500 mt-1 font-mono">₹{(stressResult.wcLineNeeded / 100000).toFixed(2)}L</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Yield optimizer */}
                  <Card className="p-5 space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-bold text-amber-500">Short-Term yield Optimization</span>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                        <span>Investable Reserves</span>
                        <span className="text-primary font-bold">₹{(investableReserves / 100000).toFixed(1)}L</span>
                      </div>
                      <input
                        type="range"
                        min="200000"
                        max="3000000"
                        step="50000"
                        value={investableReserves}
                        onChange={(e) => setInvestableReserves(Number(e.target.value))}
                        className="w-full h-1 cursor-pointer accent-primary"
                      />
                    </div>

                    <div className="space-y-2.5 text-xs border-t border-border/45 pt-3 font-semibold">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Corporate FD Yield (7.25%):</span>
                        <span className="font-bold text-foreground">₹{Math.round(investableReserves * 0.0725).toLocaleString()}/yr</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Liquid Mutual Fund (6.80%):</span>
                        <span className="font-bold text-foreground">₹{Math.round(investableReserves * 0.068).toLocaleString()}/yr</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {treasuryTab === "aging" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Accounts Receivable (A/R) Aging Schedule</span>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Aging tracks outstanding platform receipts across standard business cycles to predict collection delays.
                </p>

                <div className="h-[220px] w-full font-mono text-[10px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: "0-30 Days", amount: 450000, fill: "#10b981" },
                      { name: "31-60 Days", amount: 150000, fill: "#f59e0b" },
                      { name: "61-90 Days", amount: 85000, fill: "#f97316" },
                      { name: "90+ Days", amount: 12000, fill: "#ef4444" },
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        <Cell fill="var(--success)" />
                        <Cell fill="var(--warning)" />
                        <Cell fill="var(--amber)" />
                        <Cell fill="var(--destructive)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {treasuryTab === "debt" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Corporate debt schedules & credit amortizations</span>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Outstanding credit loans, interest rate parameters, and debt repayments schedules.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground font-bold text-[10px] uppercase">
                        <th className="py-2.5">Credit line / Bank</th>
                        <th className="py-2.5">Outstanding Balance</th>
                        <th className="py-2.5">Interest Spread</th>
                        <th className="py-2.5 text-right">Repayment term</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      <tr>
                        <td className="py-2.5 font-bold">HDFC working capital loan</td>
                        <td className="py-2.5 font-mono">₹1,200,000</td>
                        <td className="py-2.5 font-mono">9.8% Floating</td>
                        <td className="py-2.5 text-right font-mono">₹1.1L/month (12 mo remaining)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            5. COMPLIANCE AI EXPANDED INTERACTIVE PANEL
            ─────────────────────────────────────────────────────────────────── */}
        {agentId === "compliance" && (
          <div className="space-y-6">
            {/* Compliance Tabs */}
            <div className="flex gap-2 border-b border-border/40 pb-2 overflow-x-auto">
              {[
                { id: "calendar", label: "Regulatory Compliance Calendar", icon: Calendar },
                { id: "ocr", label: "AI Document Checker / Dropzone", icon: Sliders },
                { id: "risks", label: "MCA & statutory checks", icon: Scale },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setComplianceTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap",
                      complianceTab === tab.id
                        ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                        : "text-muted-foreground bg-muted/40 border-border/60 hover:text-foreground"
                    )}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {complianceTab === "calendar" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {/* compliance calendar timeline */}
                  <Card className="p-5 space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Chronological compliance calendar timelines</span>
                    <div className="space-y-3">
                      {[
                        { duty: "GSTR-1 Monthly filing", days: "15 Days remaining", status: "PENDING", date: "2026-06-11" },
                        { duty: "Quarterly TDS return upload", days: "48 Days remaining", status: "AWAITING DATA", date: "2026-07-15" },
                      ].map((cal, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-border/60 bg-muted/10 text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <div>
                              <p className="text-foreground font-bold">{cal.duty}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{cal.date} · {cal.days}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-bold text-purple-500 border-purple-500/20">
                            {cal.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Audit Readiness */}
                  <Card className="p-5 text-center space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Audit Readiness Index</span>
                    <div className="rounded-lg bg-purple-500/5 border border-purple-500/10 p-5 shadow-sm">
                      <h2 className="text-3xl font-extrabold text-purple-500">
                        {Object.values(auditCheckpoints).filter(Boolean).length * 25}%
                      </h2>
                      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed font-medium">MCA and statutory checkpoints matched for SEBI annual audits.</p>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {complianceTab === "ocr" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">AI document checker validator (OCR Parser)</span>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Drop any regulatory PDF document or invoice below. Compliance AI will run simulated OCR scanning checks to verify tax filing alignments!
                </p>

                {/* Dropzone */}
                <div
                  onClick={handleSimulateDocumentOcr}
                  className="border-2 border-dashed border-border/80 hover:border-primary/40 rounded-xl p-8 text-center cursor-pointer bg-muted/5 hover:bg-muted/15 transition-all space-y-3"
                >
                  <Sparkles className="h-8 w-8 text-purple-400 mx-auto animate-pulse" />
                  <p className="text-xs font-semibold text-foreground">Click here to upload tax PDF or vendor contracts</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Supports GSTR filing forms, MCA logs, and PDFs up to 10MB</p>
                </div>

                {isOcrScanning && (
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-500 animate-pulse justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Ingesting file text vectors...
                  </div>
                )}

                {ocrScore !== null && (
                  <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs flex justify-between items-center font-semibold">
                    <div>
                      <p className="font-bold text-foreground">Scan File: {ocrFileName || "Q2_Filing.pdf"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Checksum aligned, SEBI standards verified ✓</p>
                    </div>
                    <Badge variant="outline" className="text-purple-500 border-purple-500/20 text-xs font-bold font-mono">
                      {ocrScore}/100 Matches
                    </Badge>
                  </div>
                )}
              </Card>
            )}

            {complianceTab === "risks" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Audit checkpoints & regulatory check status</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { id: "mca", label: "MCA Annual Filings verified" },
                    { id: "tds", label: "TDS Quarterly Reconciliation complete" },
                    { id: "gst", label: "GSTR-2B compliance matches verified" },
                    { id: "pf", label: "EPF/ESIC statutory deposits matches complete" },
                  ].map((chk) => (
                    <div key={chk.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/10 text-xs font-semibold">
                      <CheckCircle2
                        onClick={() => {
                          setAuditCheckpoints((prev) => ({
                            ...prev,
                            [chk.id]: !prev[chk.id as keyof typeof prev],
                          }));
                          toast.success("Readiness parameter updated!");
                        }}
                        className={cn("h-4 w-4 cursor-pointer shrink-0 transition-colors", auditCheckpoints[chk.id as keyof typeof auditCheckpoints] ? "text-purple-500 fill-purple-500/10" : "text-muted-foreground")}
                      />
                      <span>{chk.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            6. REPORTING AI EXPANDED INTERACTIVE PANEL
            ─────────────────────────────────────────────────────────────────── */}
        {agentId === "reporting" && (
          <div className="space-y-6">
            {/* Reporting Tabs */}
            <div className="flex gap-2 border-b border-border/40 pb-2 overflow-x-auto">
              {[
                { id: "ratios", label: "Executive KPI scoreboard", icon: Activity },
                { id: "variance", label: "Budget-vs-actual variance analysis", icon: Sliders },
                { id: "briefing", label: "Corporate Board pack narratives", icon: Sparkles },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setReportingTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap",
                      reportingTab === tab.id
                        ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                        : "text-muted-foreground bg-muted/40 border-border/60 hover:text-foreground"
                    )}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {reportingTab === "ratios" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {/* key performance ratios */}
                  <Card className="p-5 space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Key Performance Ratios</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/80 text-muted-foreground font-bold text-[10px] uppercase">
                            <th className="py-2">Ratio metric</th>
                            <th className="py-2">Value</th>
                            <th className="py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-medium">
                          {(agentOutput.kpi_summary || [
                            { name: "LTV:CAC Growth Ratio", value: "3.5x", status: "Good" },
                            { name: "Gross Margin Percentage", value: "78%", status: "Excellent" },
                            { name: "EBITDA Operating Margin", value: "18.2%", status: "Nominal" },
                          ]).map((kpi: any, idx: number) => (
                            <tr key={idx} className="hover:bg-muted/10">
                              <td className="py-2.5 font-bold text-foreground">{kpi.name}</td>
                              <td className="py-2.5 text-muted-foreground font-mono">{kpi.value}</td>
                              <td className="py-2.5 text-right font-medium text-foreground">
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5"
                                >
                                  {kpi.status || "OK"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Reporting insights */}
                  <Card className="p-5 border-l-4 border-l-pink-500 space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-bold text-pink-500">Performance Insights</span>
                    <div className="space-y-3">
                      {(agentOutput.performance_insights || [
                        { insight: "Opex pacing matches sustainable models.", category: "cost", priority: "high" }
                      ]).map((ins: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted/20 border border-border/50 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 font-semibold">
                          <CheckCircle className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{ins.insight || ins}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {reportingTab === "variance" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Budget vs Actual variance analysis models</span>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Renders comparative actual spending metrics compared against budgeted baseline projections.
                </p>

                <div className="h-[220px] w-full font-mono text-[10px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { month: "Q2 Base Rev", Budget: 1200000, Actual: 1280000 },
                      { month: "Q2 Base Opex", Budget: 950000, Actual: 980000 },
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                      <XAxis dataKey="month" stroke="#6b7280" className="font-mono text-[10px]" />
                      <YAxis stroke="#6b7280" className="font-mono text-[10px]" />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar dataKey="Budget" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} opacity={0.6} />
                      <Bar dataKey="Actual" fill="var(--success)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {reportingTab === "briefing" && (
              <Card className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Boardroom pack narrative editor</span>
                  <Badge variant="outline" className="text-[9px] text-pink-500 font-bold border-pink-500/20">Executive Brief</Badge>
                </div>
                <textarea
                  value={boardNarrativeText}
                  onChange={(e) => setBoardNarrativeText(e.target.value)}
                  className="w-full bg-muted border border-border text-xs leading-relaxed text-foreground rounded-xl p-4 h-[120px] focus:outline-none font-medium"
                />
                <Button onClick={() => toast.success("Corporate boardroom narrative successfully frozen under legal lock!")} size="sm" className="h-8 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white">
                  Freeze Narrative snapshot
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            7. DECISION AI EXPANDED INTERACTIVE PANEL
            ─────────────────────────────────────────────────────────────────── */}
        {agentId === "decision" && (
          <div className="space-y-6">
            {/* Decision Tabs */}
            <div className="flex gap-2 border-b border-border/40 pb-2 overflow-x-auto">
              {[
                { id: "matrix", label: "CFO 4x4 Risk Matrix Map", icon: Sliders },
                { id: "tradeoff", label: "Strategic founder preference simulator", icon: Sliders },
                { id: "timeline", label: "CFO Actionable Recommendations", icon: Calendar },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDecisionTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap",
                      decisionTab === tab.id
                        ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                        : "text-muted-foreground bg-muted/40 border-border/60 hover:text-foreground"
                    )}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {decisionTab === "matrix" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {/* risk radar chart */}
                  <Card className="p-5 space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">4x4 Risk Matrix Analysis</span>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      Radar maps risks across four operational pillars: Cash runway, External Markets, compliance, and Operations.
                    </p>

                    <div className="h-[220px] w-full font-mono text-[9px] flex justify-center items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: "Liquidity", A: 20, fullMark: 100 },
                          { subject: "Market Risk", A: 15, fullMark: 100 },
                          { subject: "Compliance", A: 35, fullMark: 100 },
                          { subject: "Operational", A: 10, fullMark: 100 },
                        ]}>
                          <PolarGrid className="stroke-border/40" />
                          <PolarAngleAxis dataKey="subject" stroke="#6b7280" className="font-sans text-[10px] font-bold" />
                          <PolarRadiusAxis />
                          <Radar name="Risk Index" dataKey="A" stroke="var(--violet)" fill="var(--violet)" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* strategic decisions */}
                  <Card className="p-5 space-y-4 border-l-4 border-l-violet-500">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-bold text-violet-500">Recommended CFO Strategic Decisions</span>
                    <div className="space-y-3">
                      {(agentOutput.recommended_decisions || [
                        { decision: "Secure ₹50L credit line", impact: "Extends runway by 4 months", timeframe: "immediate" }
                      ]).map((dec: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted/20 border border-border/50 rounded-xl text-xs leading-relaxed space-y-1 font-semibold">
                          <div className="flex justify-between font-bold text-foreground">
                            <span>{dec.decision}</span>
                            <Badge variant="outline" className="text-[8px] uppercase">{dec.timeframe}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium">{dec.impact}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {decisionTab === "tradeoff" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Founder preference strategy alignment Simulator</span>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Correlation scoring maps opex parameters based on founder strategic growth tolerances.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Strategy Risk Appetite</span>
                      <span className="text-primary font-bold">{appetiteRisk}/100</span>
                    </div>
                    <Progress value={appetiteRisk} className="h-1.5 bg-muted" />
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={appetiteRisk}
                      onChange={(e) => setAppetiteRisk(Number(e.target.value))}
                      className="w-full h-1 cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Strategic Growth Focus</span>
                      <span className="text-primary font-bold">{growthFocus}/100</span>
                    </div>
                    <Progress value={growthFocus} className="h-1.5 bg-muted" />
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={growthFocus}
                      onChange={(e) => setGrowthFocus(Number(e.target.value))}
                      className="w-full h-1 cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-border/40">
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Correlation Matrix Score</span>
                    <h4 className="text-lg font-bold text-violet-500">{Math.round(80 + (appetiteRisk + growthFocus) / 10)}% Alignment</h4>
                  </div>
                  <Button onClick={() => toast.success("Founder strategy matrix correlation index updated successfully!")} size="sm" className="h-8 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white">
                    Update Strategy Alignment
                  </Button>
                </div>
              </Card>
            )}

            {decisionTab === "timeline" && (
              <Card className="p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">CFO Actions Timeline</span>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Chronological action timelines matching urgent recommended actions from Decision AI.
                </p>

                <div className="space-y-3 font-semibold">
                  {[
                    { horizon: "Immediate Today", action: "Review and freeze professional legal overlays invoices", owner: "CFO", priority: "CRITICAL" },
                    { horizon: "This Week", action: "Complete GST reconciliation mismatch filings warning escalation email", owner: "Finance Lead", priority: "HIGH" },
                    { horizon: "This Month", action: "Deploy investable reserve allocations in HDFC 7.25% FD portfolio wrappers", owner: "Operations", priority: "MEDIUM" },
                  ].map((act, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-border/60 bg-muted/10 text-xs">
                      <div>
                        <p className="font-bold text-foreground">{act.action}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{act.horizon} · Assignee: {act.owner}</p>
                      </div>
                      <Badge variant={act.priority === "CRITICAL" ? "destructive" : "secondary"} className="text-[8px] font-extrabold">{act.priority}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── COMPANY INTELLIGENCE TRACKER & COMPETITOR INTEL ────────────────── */}
        <div className="space-y-6 pt-6 border-t border-border/60">
          <Toaster richColors position="top-right" />
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Tracked Companies & Competitor Intel
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add competitors or partner companies to trigger autonomous web scraping and detailed strategic AI profiles.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 items-start">
            {/* Form Column */}
            <Card className="p-5 border border-border/60 bg-card/40 backdrop-blur-sm space-y-4 lg:col-span-1">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Track New Company</span>
              </div>
              
              <form onSubmit={handleTrackCompany} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Company Name *</label>
                  <Input 
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Stripe" 
                    className="h-8 text-xs bg-background" 
                    disabled={submittingCompany}
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Website URL (Optional)</label>
                  <Input 
                    value={companyUrl}
                    onChange={e => setCompanyUrl(e.target.value)}
                    placeholder="https://stripe.com" 
                    type="url"
                    className="h-8 text-xs bg-background" 
                    disabled={submittingCompany}
                  />
                  <p className="text-[9px] text-muted-foreground">URL is scraped using BeautifulSoup to extract core context for AI synthesis.</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5"
                  disabled={submittingCompany}
                >
                  {submittingCompany ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Scraping & Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Start AI Research
                    </>
                  )}
                </Button>
              </form>
            </Card>

            {/* List Column */}
            <div className="lg:col-span-2 space-y-3">
              {loadingCompanies ? (
                <Card className="p-8 border border-border/60 text-center">
                  <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading competitor workspace...</p>
                </Card>
              ) : !companies || companies.length === 0 ? (
                <Card className="p-8 border border-dashed border-border/80 text-center">
                  <Bot className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                  <h4 className="text-xs font-bold text-muted-foreground">No companies tracked yet</h4>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Enter a competitor's name and website on the left to generate real-time AI research cards.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {companies.map((c) => {
                    const s = c.summary || {};
                    const isOpen = !!expandedCompany[c.id];
                    const threatColor = {
                      low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                      medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                      high: "bg-red-500/10 text-red-500 border-red-500/20"
                    }[s.competitive_threat || "medium"] || "bg-muted text-muted-foreground";

                    const sentimentColor = {
                      positive: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                      negative: "bg-red-500/10 text-red-600 border-red-500/20",
                      neutral: "bg-muted text-muted-foreground"
                    }[s.sentiment || "neutral"] || "bg-muted text-muted-foreground";

                    return (
                      <Card key={c.id} className="border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden hover:shadow-md transition-all duration-300">
                        {/* Header */}
                        <div 
                          className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-muted/20"
                          onClick={() => toggleCompanyExpand(c.id)}
                        >
                          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                            <Globe className="h-4.5 w-4.5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground truncate">{c.name}</span>
                              {c.url && (
                                <a 
                                  href={c.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-muted-foreground hover:text-primary shrink-0 transition-colors"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Link2 className="h-3 w-3" />
                                </a>
                              )}
                              {s.sentiment && (
                                <Badge variant="outline" className={cn("text-[8px] px-1 py-0 capitalize shrink-0", sentimentColor)}>
                                  {s.sentiment}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {s.tagline || "Competitor research completed."}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {s.competitive_threat && (
                              <Badge variant="outline" className={cn("text-[8px] uppercase tracking-wider font-semibold", threatColor)}>
                                Threat: {s.competitive_threat}
                              </Badge>
                            )}
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
                          </div>
                        </div>

                        {/* Body */}
                        <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                          <div className="overflow-hidden">
                            <div className="p-4 pt-0 border-t border-border/50 bg-muted/10 space-y-4">
                              {/* Market Position Description */}
                              {s.market_position && (
                                <div className="border-l-2 border-primary bg-background p-3 rounded-r-lg shadow-sm text-xs text-foreground/90 font-medium mt-3">
                                  {s.market_position}
                                </div>
                              )}

                              {/* Products & Segments */}
                              <div className="grid gap-3 sm:grid-cols-2">
                                {s.core_products && s.core_products.length > 0 && (
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Core Offerings</label>
                                    <div className="flex flex-wrap gap-1">
                                      {s.core_products.map((p: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-[9px] font-medium bg-background text-foreground/80">
                                          {p}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {s.target_segments && s.target_segments.length > 0 && (
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Target Segments</label>
                                    <div className="flex flex-wrap gap-1">
                                      {s.target_segments.map((seg: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-[9px] font-medium bg-background text-foreground/80">
                                          {seg}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Strengths & Risks */}
                              <div className="grid gap-3 sm:grid-cols-2">
                                {s.key_strengths && s.key_strengths.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" /> Core Strengths
                                    </span>
                                    <ul className="space-y-1 text-[11px] text-foreground/80">
                                      {s.key_strengths.map((str: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-1.5">
                                          <span className="text-emerald-500 font-bold shrink-0">•</span>
                                          <span>{str}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {s.key_risks && s.key_risks.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" /> Main Vulnerabilities
                                    </span>
                                    <ul className="space-y-1 text-[11px] text-foreground/80">
                                      {s.key_risks.map((risk: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-1.5">
                                          <span className="text-red-500 font-bold shrink-0">•</span>
                                          <span>{risk}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {/* Financial Signals */}
                              {s.financial_signals && (
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Financial Indicators</label>
                                  <p className="text-[11px] text-foreground/80 leading-relaxed font-mono bg-background/50 p-2 rounded-lg border border-border/40">
                                    {s.financial_signals}
                                  </p>
                                </div>
                              )}

                              {/* Strategic Recommendation */}
                              {s.strategic_recommendation && (
                                <Card className="p-3 border border-primary/20 bg-primary/5 space-y-1">
                                  <label className="text-[9px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> Strategic AI Recommendation
                                  </label>
                                  <p className="text-[11px] font-medium text-foreground leading-relaxed">
                                    {s.strategic_recommendation}
                                  </p>
                                </Card>
                              )}

                              {/* Stop tracking actions */}
                              <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                                <span className="text-[9px] text-muted-foreground">
                                  Scraped {c.last_scraped_at ? new Date(c.last_scraped_at).toLocaleDateString() : "Pending"}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-500/10 flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCompany(c.id, c.name);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" /> Stop Tracking
                                </Button>
                              </div>

                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
