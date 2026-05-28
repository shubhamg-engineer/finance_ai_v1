import Papa from "papaparse";

export type TxType = "Revenue" | "Expense";

export interface Transaction {
  id?: number;
  date: string; // ISO yyyy-mm-dd
  type: TxType;
  amount: number;
  category: string;
  description?: string;
  vendor?: string;       // Vendor / Client name
  method?: string;       // Payment method: NEFT | RTGS | UPI | Cheque | Card | Internal
  risk?: string;         // Risk classification: Low | Medium | High
  is_edited?: boolean;
}

export interface MonthlyPoint {
  month: string; // yyyy-mm
  revenue: number;
  expenses: number;
  net: number;
}

export interface Kpis {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  monthlyBurn: number;
  runwayMonths: number | null;
  cashOnHand: number;
  grossMarginPct: number;
  monthly: MonthlyPoint[];
  forecast: MonthlyPoint[];
  priority: "CRITICAL" | "WARNING" | "NORMAL";
  priorityReason: string;
  trendSummary: string;
  topCategories: { category: string; amount: number }[];
}

export interface UploadedDataSummary {
  filename: string;
  transaction_count: number;
  rows_skipped: number;
  period_start: string;
  period_end: string;
  sheets_detected: string[];
  currency: string;
}

export interface CompositePattern {
  pattern_id: string;
  name: string;
  severity: "CRITICAL" | "HIGH" | "WARNING";
  description: string;
  modules_involved: string[];
  component_signals: string[];
  recommended_action: string;
}

export interface DimensionScore {
  dimension: string;
  weight: number;
  raw_score: number;
  weighted_score: number;
  penalties: string[];
}

export interface HealthScore {
  score: number;
  label: string;
  dimensions: DimensionScore[];
  board_narrative?: string;
  computed_at?: string;
}

export interface BotPayload {
  bot: string;
  output: Record<string, any> | string;
  meta?: { duration_ms?: number; model?: string };
}

export type BotKey = "research" | "planning" | "accounting" | "treasury" | "compliance" | "reporting" | "decision" | "final";

export interface PipelineResult {
  execution_flow: string[];
  kpis: Record<string, any>;
  research: BotPayload;
  planning: BotPayload;
  accounting: BotPayload;
  treasury: BotPayload;
  compliance: BotPayload;
  reporting: BotPayload;
  decision: BotPayload;
  final: BotPayload;
  finance_health_score: HealthScore;
  composite_patterns: CompositePattern[];
  latency_seconds: number;
  data_summary: Record<string, any>;
  error?: string;
}

export function parseAmount(v: unknown): number {
  if (typeof v === "number") return Math.abs(v);
  if (typeof v !== "string") return NaN;
  const cleaned = v
    .trim()
    .replace(/[₹$€,\s]/g, "")
    .replace(/\((.+)\)/, "-$1");
  return cleaned === "" ? NaN : Math.abs(Number(cleaned));
}

export function normalizeType(v: unknown): TxType | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (["revenue", "income", "sales", "credit", "inflow", "receipt", "earn"].includes(s))
    return "Revenue";
  if (["expense", "expenses", "cost", "debit", "spend", "outflow", "payment", "purchase"].includes(s))
    return "Expense";
  return null;
}

export function normalizeDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    if (yy.length === 2) yy = "20" + yy;
    const d2 = new Date(Number(yy), Number(mm) - 1, Number(dd));
    if (!isNaN(d2.getTime())) return d2.toISOString().slice(0, 10);
  }
  return null;
}

export function cleanRows(rows: Record<string, unknown>[]): { txns: Transaction[]; skipped: number } {
  const lower = (k: string) => k.trim().toLowerCase();
  const findKey = (row: Record<string, unknown>, candidates: string[]) => {
    const keys = Object.keys(row);
    for (const c of candidates) {
      const found = keys.find((k) => lower(k) === c);
      if (found) return found;
    }
    return null;
  };

  const txns: Transaction[] = [];
  let skipped = 0;

  if (rows.length === 0) return { txns, skipped };

  const firstRow = rows[0];
  const dateK = findKey(firstRow, ["date", "transaction date", "txn date", "trans date", "value date", "timestamp", "time"]);
  const creditK = findKey(firstRow, ["credit", "credit amount", "deposit", "deposits", "inflow", "inflows", "received", "revenue amount"]);
  const debitK = findKey(firstRow, ["debit", "debit amount", "withdrawal", "withdrawals", "outflow", "outflows", "spend", "payment", "charge", "charges", "expense amount"]);
  const typeK = findKey(firstRow, ["type", "kind", "category type", "transaction type", "txn type", "credit/debit", "cr/dr"]);
  const amtK = findKey(firstRow, ["amount", "value", "total", "sum", "net amount", "balance", "net"]);
  const catK = findKey(firstRow, ["category", "description", "label", "particulars", "narration", "remarks", "head", "details", "payee", "memo"]);
  const descK = findKey(firstRow, ["description", "narration", "remarks", "particulars", "notes", "memo"]);

  if (!dateK) {
    const available = Object.keys(firstRow).join(", ");
    throw new Error(`Missing Date column. Found headers: ${available}`);
  }
  
  if (!amtK && !creditK && !debitK) {
    const available = Object.keys(firstRow).join(", ");
    throw new Error(`Missing Amount column. Found headers: ${available}`);
  }

  for (const row of rows) {
    const date = normalizeDate(row[dateK]);
    if (!date) { skipped++; continue; }

    const category = catK ? String(row[catK] ?? "Uncategorized") : "Uncategorized";
    const description = descK ? String(row[descK] ?? "") : "";

    let parsedAmount = NaN;
    let parsedType: TxType | null = null;

    // Scenario A: Separate Credit/Debit columns
    if (creditK || debitK) {
      const credVal = creditK ? parseAmount(row[creditK]) : NaN;
      const debVal = debitK ? parseAmount(row[debitK]) : NaN;

      if (!isNaN(credVal) && credVal > 0) {
        parsedAmount = credVal;
        parsedType = "Revenue";
      } else if (!isNaN(debVal) && debVal > 0) {
        parsedAmount = debVal;
        parsedType = "Expense";
      }
    }

    // Scenario B: Explicit Type column + Amount column
    if (isNaN(parsedAmount) && typeK && amtK) {
      parsedType = normalizeType(row[typeK]);
      parsedAmount = parseAmount(row[amtK]);
    }

    // Scenario C: Signed Amount column only (negative represents Expense, positive represents Revenue)
    if (isNaN(parsedAmount) && amtK) {
      const rawAmtStr = String(row[amtK] ?? "").trim();
      const hasParentheses = rawAmtStr.startsWith("(") && rawAmtStr.endsWith(")");
      const isExplicitNegative = rawAmtStr.startsWith("-") || hasParentheses;
      const absAmt = parseAmount(rawAmtStr);

      if (!isNaN(absAmt) && absAmt > 0) {
        parsedAmount = absAmt;
        parsedType = isExplicitNegative ? "Expense" : "Revenue";
      }
    }

    if (isNaN(parsedAmount) || !parsedType || !isFinite(parsedAmount)) {
      skipped++;
      continue;
    }

    txns.push({ date, type: parsedType, amount: parsedAmount, category, description });
  }

  return { txns, skipped };
}

export function parseJsonFinancialData(json: unknown): Transaction[] {
  let items: unknown[] = [];
  if (Array.isArray(json)) {
    items = json;
  } else if (typeof json === "object" && json !== null) {
    const obj = json as Record<string, unknown>;
    for (const key of ["transactions", "data", "records", "rows"]) {
      if (Array.isArray(obj[key])) { items = obj[key] as unknown[]; break; }
    }
  }
  const txns: Transaction[] = [];
  for (const item of items) {
    if (typeof item !== "object" || !item) continue;
    const row = item as Record<string, unknown>;
    const date = normalizeDate(row.date ?? row.Date ?? row.transaction_date);
    const type = normalizeType(row.type ?? row.Type ?? row.kind ?? row.category_type);
    const amount = parseAmount(row.amount ?? row.Amount ?? row.value ?? row.total);
    const category = String(row.category ?? row.Category ?? row.description ?? "Uncategorized");
    const description = String(row.description ?? row.narration ?? row.remarks ?? "");
    if (date && type && isFinite(amount) && amount > 0) {
      txns.push({ date, type, amount, category, description });
    }
  }
  return txns;
}

export function computeKpis(txns: Transaction[]): Kpis {
  const totalRevenue = txns.filter((t) => t.type === "Revenue").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = txns.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
  const profit = totalRevenue - totalExpenses;

  const map = new Map<string, MonthlyPoint>();
  for (const t of txns) {
    const m = t.date.slice(0, 7);
    const cur = map.get(m) ?? { month: m, revenue: 0, expenses: 0, net: 0 };
    if (t.type === "Revenue") cur.revenue += t.amount;
    else cur.expenses += t.amount;
    cur.net = cur.revenue - cur.expenses;
    map.set(m, cur);
  }
  const monthly = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));

  const recent = monthly.slice(-3);
  const avgNet = recent.length ? recent.reduce((s, m) => s + m.net, 0) / recent.length : 0;
  const monthlyBurn = avgNet < 0 ? Math.abs(avgNet) : 0;
  const cashOnHand = profit;
  const runwayMonths = monthlyBurn > 0 ? Math.max(0, cashOnHand / monthlyBurn) : null;
  const grossMarginPct = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

  const forecast: MonthlyPoint[] = [];
  if (monthly.length >= 2) {
    const n = monthly.length;
    const xs = monthly.map((_, i) => i);
    const ysR = monthly.map((m) => m.revenue);
    const ysE = monthly.map((m) => m.expenses);
    const lin = (ys: number[]) => {
      const xMean = xs.reduce((a, b) => a + b, 0) / n;
      const yMean = ys.reduce((a, b) => a + b, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) {
        num += (xs[i] - xMean) * (ys[i] - yMean);
        den += (xs[i] - xMean) ** 2;
      }
      const slope = den === 0 ? 0 : num / den;
      const intercept = yMean - slope * xMean;
      return (x: number) => Math.max(0, intercept + slope * x);
    };
    const fR = lin(ysR);
    const fE = lin(ysE);
    const lastMonth = monthly[monthly.length - 1].month;
    const [y, mo] = lastMonth.split("-").map(Number);
    for (let i = 1; i <= 3; i++) {
      const d = new Date(y, mo - 1 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const r = fR(n - 1 + i);
      const e = fE(n - 1 + i);
      forecast.push({ month: key, revenue: r, expenses: e, net: r - e });
    }
  }

  let priority: Kpis["priority"] = "NORMAL";
  let priorityReason = "Financials are stable.";
  if (profit < 0 && Math.abs(profit) > totalRevenue * 0.2 && totalRevenue > 0) {
    priority = "CRITICAL";
    priorityReason = "Net loss exceeds 20% of revenue.";
  } else if (runwayMonths !== null && runwayMonths < 6) {
    priority = "CRITICAL";
    priorityReason = `Cash runway critical: ${runwayMonths.toFixed(1)} months remaining.`;
  } else if (monthlyBurn > 0 && (runwayMonths === null || runwayMonths < 12)) {
    priority = "WARNING";
    priorityReason = "High burn rate detected.";
  } else if (profit < 0) {
    priority = "WARNING";
    priorityReason = "Operating at a net loss.";
  }

  let trendSummary = "Insufficient data for trend analysis.";
  if (monthly.length >= 2) {
    const first = monthly[0];
    const last = monthly[monthly.length - 1];
    const revGrowth = first.revenue ? ((last.revenue - first.revenue) / first.revenue) * 100 : 0;
    const expGrowth = first.expenses ? ((last.expenses - first.expenses) / first.expenses) * 100 : 0;
    trendSummary = `Across ${monthly.length} months: revenue ${revGrowth >= 0 ? "+" : ""}${revGrowth.toFixed(1)}%, expenses ${expGrowth >= 0 ? "+" : ""}${expGrowth.toFixed(1)}%.`;
  }

  const catSpend: Record<string, number> = {};
  for (const t of txns) catSpend[t.category] = (catSpend[t.category] ?? 0) + t.amount;
  const topCategories = Object.entries(catSpend)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
    totalRevenue,
    totalExpenses,
    profit,
    monthlyBurn,
    runwayMonths,
    cashOnHand,
    grossMarginPct,
    monthly,
    forecast,
    priority,
    priorityReason,
    trendSummary,
    topCategories,
  };
}

export function formatCurrency(n: number, currency = "INR"): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₹";
  if (abs >= 10_000_000) return `${sign}${sym}${(abs / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000) return `${sign}${sym}${(abs / 100_000).toFixed(2)}L`;
  if (abs >= 1_000) return `${sign}${sym}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${sym}${abs.toFixed(0)}`;
}
