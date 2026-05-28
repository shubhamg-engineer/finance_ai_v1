import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const API_URL = import.meta.env.VITE_FINANCE_AI_API_URL ?? "http://127.0.0.1:8000";

// Types
export interface Transaction {
  id: number;
  date: string;
  type: "Revenue" | "Expense";
  amount: number;
  category: string;
  description: string;
  vendor?: string;       // Vendor / Client name
  method?: string;       // Payment method: NEFT | RTGS | UPI | Cheque | Card | Internal
  risk?: string;         // Risk classification: Low | Medium | High
  is_edited: boolean;
}

export interface UploadedFile {
  id: string;
  company_name: string;
  original_name: string;
  file_path: string;
  currency: string;
  period_start: string;
  period_end: string;
  tx_count: number;
  created_at: string;
  updated_at: string;
}

export interface KPIPreview {
  total_revenue: number;
  total_expenses: number;
  profit: number;
  monthly_burn: number;
  runway_months: number | null;
  priority: string;
  priority_reason: string;
  trend_summary: string;
  top_categories: Array<{ category: string; amount: number; percentage: number }>;
  monthly_breakdown: Array<{
    month: string;
    revenue: number;
    expenses: number;
    net: number;
  }>;
}

export interface FileDetails {
  metadata: UploadedFile;
  kpi_preview: KPIPreview | null;
  analyses: Array<{
    id: string;
    health_score: number;
    priority: string;
    latency_s: number;
    created_at: string;
  }>;
}

export interface AnalysisSummary {
  id: string;
  file_id: string;
  filename: string;
  company_name: string;
  health_score: number;
  priority: string;
  latency_s: number;
  created_at: string;
}

export interface AnalysisDetails {
  id: string;
  file_id: string;
  filename: string;
  health_score: number;
  priority: string;
  latency_s: number;
  created_at: string;
  result: PipelineResult;
}

export interface PipelineResult {
  analysis_id?: string;
  execution_flow: string[];
  kpis: {
    total_revenue: number;
    total_expenses: number;
    profit: number;
    monthly_burn: number;
    runway_months: number | null;
    cash_on_hand: number;
    gross_margin_pct: number;
    revenue_growth_pct: number;
    expense_growth_pct: number;
    net_margin_pct: number;
    burn_rate_pct: number;
    months_analyzed: number;
    priority: string;
    priority_reason: string;
    trend_summary: string;
    top_categories: Array<{ category: string; amount: number; percentage: number }>;
  };
  research: {
    output: {
      market_sentiment?: string;
      risk_factors?: string[];
      opportunities?: string[];
      macro_assumptions?: string[];
      competitor_pricing?: string;
      regulatory_alerts?: string[];
      monetary_policy?: string;
      global_factors?: string[];
      [key: string]: any;
    };
    [key: string]: any;
  };
  planning: {
    output: {
      months_projections?: Array<{ month: string; revenue: number; expenses: number; cash: number }>;
      scenarios?: {
        conservative?: { runway: number; burn: number };
        base?: { runway: number; burn: number };
        optimistic?: { runway: number; burn: number };
      };
      action_items?: string[];
      [key: string]: any;
    };
    [key: string]: any;
  };
  accounting: {
    output: {
      anomalies?: Array<{ id: number; reason: string; severity: string; details?: string }>;
      fraud_risk_score?: number;
      fraud_indicators?: string[];
      category_reclassifications?: Array<{ original: string; suggested: string; confidence: number }>;
      gst_reconciliation_issues?: string[];
      [key: string]: any;
    };
    [key: string]: any;
  };
  treasury: {
    output: {
      cash_position_summary?: string;
      liquidity_score?: number;
      investment_options?: Array<{ instrument: string; yield: string; risk: string; horizon: string }>;
      stress_test_results?: Array<{ scenario: string; cash_impact: string; outcome: string }>;
      working_capital_advice?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  compliance: {
    output: {
      tax_obligations?: Array<{ tax_type: string; status: string; estimate: number }>;
      deadlines?: Array<{ task: string; due_date: string; priority: string }>;
      audit_readiness_score?: number;
      compliance_warnings?: string[];
      [key: string]: any;
    };
    [key: string]: any;
  };
  reporting: {
    output: {
      kpi_summary?: Array<{ name: string; value: string; status: string }>;
      board_narrative?: string;
      performance_insights?: string[];
      [key: string]: any;
    };
    [key: string]: any;
  };
  decision: {
    output: {
      risk_quadrant?: { axis_x: string; axis_y: string; zone: string };
      recommended_decisions?: Array<{ decision: string; impact: string; timeframe: string; confidence: number }>;
      founder_alignment_score?: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
  final: {
    output: {
      overall_priority?: string;
      final_summary?: string;
      urgent_actions?: string[];
      daily_briefing?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  finance_health_score: {
    score: number;
    label: string;
    breakdown: {
      liquidity: number;
      efficiency: number;
      growth: number;
      compliance: number;
      anomalies: number;
    };
  };
  composite_patterns: Array<{
    pattern_id: string;
    severity: string;
    title: string;
    description: string;
    name?: string;
    modules_involved?: string[];
    recommended_action?: string;
  }>;
  latency_seconds: number;
}

export interface FounderPreference {
  key: string;
  value: string;
  description: string;
  updated_at?: string;
}

export interface Signal {
  id: number;
  signal_type: string;
  source_module: string;
  severity: string;
  title: string;
  description: string;
  monetary_amount: number | null;
  created_at: string;
}

// Fetch helper
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let message = "An error occurred";
    try {
      const parsed = JSON.parse(text);
      message = parsed.detail || parsed.message || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// API Functions
export const api = {
  // System Health
  getHealth: () => request<{ status: string; service: string; version: string; model: string; timestamp: string }>("/health"),

  // Files
  getFiles: () => request<UploadedFile[]>("/files"),
  uploadFile: async (file: File): Promise<{ status: string; file_id: string; filename: string; transaction_count: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/files`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
  },
  getFile: (id: string) => request<FileDetails>(`/files/${id}`),
  deleteFile: (id: string) => request<{ status: string; message: string }>(`/files/${id}`, { method: "DELETE" }),

  // Transactions
  getTransactions: (
    fileId: string,
    params?: { page?: number; page_size?: number; search?: string; type_filter?: string; category_filter?: string }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.page_size) searchParams.append("page_size", params.page_size.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.type_filter) searchParams.append("type_filter", params.type_filter);
    if (params?.category_filter) searchParams.append("category_filter", params.category_filter);

    const queryStr = searchParams.toString();
    return request<{
      transactions: Transaction[];
      total: number;
      page: number;
      page_size: number;
      categories: string[];
    }>(`/files/${fileId}/transactions?${queryStr}`);
  },
  addTransaction: (fileId: string, transaction: Omit<Transaction, "id" | "is_edited">) =>
    request<{ status: string; transaction: Transaction }>(`/files/${fileId}/transactions`, {
      method: "POST",
      body: JSON.stringify(transaction),
    }),
  editTransaction: (fileId: string, txId: number, transaction: Omit<Transaction, "id" | "is_edited">) =>
    request<{ status: string; transaction: Transaction }>(`/files/${fileId}/transactions/${txId}`, {
      method: "PUT",
      body: JSON.stringify(transaction),
    }),
  deleteTransaction: (fileId: string, txId: number) =>
    request<{ status: string }>(`/files/${fileId}/transactions/${txId}`, { method: "DELETE" }),

  // Run Pipeline
  runPipeline: (fileId: string) => request<PipelineResult>(`/files/${fileId}/run`, { method: "POST" }),

  // Analyses
  getAnalyses: () => request<AnalysisSummary[]>("/analyses"),
  getAnalysis: (id: string) => request<AnalysisDetails>(`/analyses/${id}`),

  // Preferences
  getPreferences: () => request<Record<string, { value: string; description: string; updated_at?: string }>>("/preferences"),
  updatePreference: (key: string, value: string, description?: string) =>
    request<any>(`/preferences/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value, description }),
    }),

  // Signals & Logs
  getSignals: (limit = 50) => request<Signal[]>(`/signals?limit=${limit}`),
  getDecisionMemory: (limit = 20) => request<any[]>(`/decision-memory?limit=${limit}`),
  recordDecision: (decision: {
    signal_type: string;
    signal_severity: string;
    monetary_amount?: number;
    action_taken: string;
    outcome?: string;
    context_snapshot?: any;
  }) => request<any>("/decision-memory", { method: "POST", body: JSON.stringify(decision) }),
  getModuleHealth: () => request<Record<string, { last_run: string | null; signal_count: number; status: string }>>("/module-health"),
};

// ── New Feature Types ────────────────────────────────────────────────────────

export interface MarketTicker {
  symbol: string;
  label: string;
  price: number;
  price_inr: number | null;
  price_usd: number | null;
  change_pct: number;
  change_abs: number;
  currency: string;
  type: "index" | "crypto" | "forex" | "commodity" | "rate";
  direction: "up" | "down";
  timestamp: string;
}

export interface MarketData {
  tickers: MarketTicker[];
  usdinr: number;
  market_status: "open" | "closed";
  generated_at: string;
}

export interface MacroPulse {
  central_bank_rates: { rbi_repo: number; us_fed: number; ecb: number; boe: number; last_updated: string };
  inflation: { india_cpi: number; india_wpi: number; us_cpi: number; eu_cpi: number; as_of: string };
  sector_risk: Record<string, string>;
  overall_sentiment: string;
  news: Array<{ headline: string; sentiment: string; source: string; impact: string }>;
  generated_at: string;
}

export interface FxData {
  base: string;
  rates: Record<string, number>;
  yield_products: Array<{ name: string; yield_pct: number; risk: string; horizon: string; currency: string }>;
  generated_at: string;
}

export interface Invoice {
  id: string;
  vendor_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  amount_inr: number;
  gst_number: string | null;
  gst_amount: number | null;
  category: string;
  status: string;
  notes: string | null;
  original_filename: string | null;
  is_duplicate_flag: boolean;
  created_at: string | null;
}

export interface ReconciliationSummary {
  id: string;
  name: string;
  total_bank: number;
  total_ledger: number;
  matched: number;
  unmatched_bank: number;
  unmatched_ledger: number;
  match_rate_pct: number;
  created_at: string | null;
}

export interface ReconciliationResult extends ReconciliationSummary {
  matched_items: Array<{ bank: any; ledger: any; match_score: number }>;
  unmatched_bank_items: any[];
  unmatched_ledger_items: any[];
}

export interface Vendor {
  id: string | null;
  vendor_name: string;
  category: string;
  total_spend_inr: number;
  total_spend_usd: number;
  transaction_count: number;
  concentration_pct: number;
  risk_level: string;
  gst_number: string | null;
  payment_terms: string | null;
  notes: string | null;
  is_verified: boolean;
}

export interface TrackedCompany {
  id: string;
  name: string;
  url: string | null;
  last_scraped_at: string | null;
  created_at: string | null;
  summary: {
    company_name?: string;
    url?: string;
    tagline?: string;
    market_position?: string;
    core_products?: string[];
    target_segments?: string[];
    key_strengths?: string[];
    key_risks?: string[];
    competitive_threat?: "low" | "medium" | "high";
    financial_signals?: string;
    strategic_recommendation?: string;
    sentiment?: "positive" | "neutral" | "negative";
    [key: string]: any;
  };
}

export interface ScenarioResult {
  adjusted_revenue: number;
  adjusted_expenses: number;
  adjusted_profit: number;
  monthly_burn: number;
  runway_months: number | null;
  health_impact: string;
  recommendation: string;
}

export interface TaxDeadline {
  task: string;
  jurisdiction: string;
  due_date: string;
  priority: string;
  category: string;
  penalty: string;
}

export interface TaxCalendar {
  deadlines: TaxDeadline[];
  gst_reconciliation: {
    gstr1_filed: boolean;
    gstr2b_available: boolean;
    gstr3b_filed: boolean;
    itc_available_inr: number;
    itc_claimed_inr: number;
    variance_inr: number;
    status: string;
  };
  audit_readiness: {
    score: number;
    label: string;
    checklist: Array<{ item: string; done: boolean }>;
  };
  generated_at: string;
}

// ── Extended API ────────────────────────────────────────────────────────────

export const apiExt = {
  // Markets
  getMarkets: () => request<MarketData>("/api/markets/live"),
  getMacroPulse: () => request<MacroPulse>("/api/macro-pulse"),
  getFxRates: () => request<FxData>("/api/treasury/fx-rates"),

  // Invoices
  getInvoices: () => request<Invoice[]>("/api/invoices"),
  createInvoice: (data: Omit<Invoice, "id" | "created_at" | "is_duplicate_flag" | "original_filename" | "status">) =>
    request<{ status: string; invoice: Invoice }>("/api/invoices", { method: "POST", body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: Partial<Invoice>) =>
    request<{ status: string; invoice: Invoice }>(`/api/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteInvoice: (id: string) =>
    request<{ status: string }>(`/api/invoices/${id}`, { method: "DELETE" }),
  uploadInvoice: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/api/invoices/upload`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ status: string; invoice: Invoice; is_duplicate: boolean }>;
  },

  // Reconciliation
  getReconciliations: () => request<ReconciliationSummary[]>("/api/reconcile"),
  reconcile: async (bankFile: File, ledgerFile: File) => {
    const formData = new FormData();
    formData.append("bank_file", bankFile);
    formData.append("ledger_file", ledgerFile);
    const res = await fetch(`${API_URL}/api/reconcile`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<ReconciliationResult>;
  },

  // Vendors
  getVendors: (fileId?: string) =>
    request<{ vendors: Vendor[]; total_expense_inr: number }>(`/api/vendors${fileId ? `?file_id=${fileId}` : ""}`),
  addVendor: (data: Pick<Vendor, "vendor_name"> & Partial<Omit<Vendor, "id" | "total_spend_inr" | "total_spend_usd" | "transaction_count" | "concentration_pct">>) =>
    request<{ status: string; vendor_name: string; id: string }>("/api/vendors", {
      method: "POST", body: JSON.stringify(data),
    }),
  updateVendor: (vendorName: string, data: Partial<Vendor>) =>
    request<{ status: string; vendor_name: string }>(`/api/vendors/${encodeURIComponent(vendorName)}`, {
      method: "PUT", body: JSON.stringify(data),
    }),
  deleteVendor: (vendorName: string) =>
    request<{ status: string; vendor_name: string }>(`/api/vendors/${encodeURIComponent(vendorName)}`, {
      method: "DELETE",
    }),

  // Company Tracking
  trackCompany: (data: { name: string; url?: string }) =>
    request<{ status: string; id: string; name: string; url: string | null; summary: TrackedCompany["summary"]; last_scraped_at: string | null }>("/api/companies/track", {
      method: "POST", body: JSON.stringify(data),
    }),
  getTrackedCompanies: () =>
    request<TrackedCompany[]>("/api/companies/track"),
  deleteTrackedCompany: (id: string) =>
    request<{ status: string; id: string }>(`/api/companies/track/${id}`, { method: "DELETE" }),

  // Scenarios
  calculateScenario: (data: {
    base_revenue: number; base_expenses: number;
    revenue_change_pct: number; expense_change_pct: number;
    headcount_change: number; avg_salary_inr: number; cash_reserve_inr: number;
  }) => request<ScenarioResult>("/api/scenarios/calculate", { method: "POST", body: JSON.stringify(data) }),

  // Compliance
  getTaxCalendar: () => request<TaxCalendar>("/api/compliance/tax-calendar"),

  // Board Pack
  getBoardPackData: (analysisId: string) => request<any>(`/api/board-pack/data/${analysisId}`),

  // Copilot Chat
  queryCfo: (query: string, fileId?: string | null) =>
    request<{ answer: string; modules: string[]; signals: string[] }>("/api/query", {
      method: "POST",
      body: JSON.stringify({ query, file_id: fileId }),
    }),
};

// React Query Hooks
export function useFiles() {
  return useQuery({
    queryKey: ["files"],
    queryFn: () => api.getFiles(),
  });
}

export function useFile(id: string | null) {
  return useQuery({
    queryKey: ["file", id],
    queryFn: () => api.getFile(id!),
    enabled: !!id,
  });
}

export function useTransactions(
  fileId: string | null,
  params?: { page?: number; page_size?: number; search?: string; type_filter?: string; category_filter?: string }
) {
  return useQuery({
    queryKey: ["transactions", fileId, params],
    queryFn: () => api.getTransactions(fileId!, params),
    enabled: !!fileId,
  });
}

export function useAnalyses() {
  return useQuery({
    queryKey: ["analyses"],
    queryFn: () => api.getAnalyses(),
  });
}

export function useAnalysis(id: string | null) {
  return useQuery({
    queryKey: ["analysis", id],
    queryFn: () => api.getAnalysis(id!),
    enabled: !!id,
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => api.getPreferences(),
  });
}

export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: () => api.getSignals(),
  });
}

export function useModuleHealth() {
  return useQuery({
    queryKey: ["module-health"],
    queryFn: () => api.getModuleHealth(),
  });
}

export function useRunPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => api.runPipeline(fileId),
    onSuccess: (data, fileId) => {
      queryClient.invalidateQueries({ queryKey: ["file", fileId] });
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
    },
  });
}

// ── New Feature Hooks ────────────────────────────────────────────────────────

export function useMarketData() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: () => apiExt.getMarkets(),
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useMacroPulse() {
  return useQuery({
    queryKey: ["macro-pulse"],
    queryFn: () => apiExt.getMacroPulse(),
    refetchInterval: 300000, // 5 min
  });
}

export function useFxRates() {
  return useQuery({
    queryKey: ["fx-rates"],
    queryFn: () => apiExt.getFxRates(),
    refetchInterval: 30000,
  });
}

export function useInvoices() {
  return useQuery({ queryKey: ["invoices"], queryFn: () => apiExt.getInvoices() });
}

export function useReconciliations() {
  return useQuery({ queryKey: ["reconciliations"], queryFn: () => apiExt.getReconciliations() });
}

export function useVendors(fileId?: string) {
  return useQuery({ queryKey: ["vendors", fileId], queryFn: () => apiExt.getVendors(fileId) });
}

export function useTaxCalendar() {
  return useQuery({
    queryKey: ["tax-calendar"],
    queryFn: () => apiExt.getTaxCalendar(),
    staleTime: 3600000,
  });
}

export function useTrackedCompanies() {
  return useQuery({
    queryKey: ["tracked-companies"],
    queryFn: () => apiExt.getTrackedCompanies(),
    staleTime: 60000,
  });
}
