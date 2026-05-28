import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceStore } from "@/lib/store";
import { useFile, useTransactions } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, RefreshCw, BarChart3, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/monthly")({
  component: MonthlySummariesPage,
});

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

function MonthlySummariesPage() {
  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const { data: fileData, isLoading: isFileLoading } = useFile(currentFileId);
  const { data: txnsData, isLoading: isTxnsLoading } = useTransactions(currentFileId, { page_size: 1000 });

  const activeFile = fileData?.metadata;
  const transactions = txnsData?.transactions ?? [];

  const [monthlyList, setMonthlyList] = useState<MonthlyData[]>([]);

  // Calculate monthly summaries from transactions on mount/change
  const calculatedMonthly = useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number }> = {};
    transactions.forEach((tx) => {
      const dateStr = tx.date; // yyyy-mm-dd
      const monthStr = dateStr.slice(0, 7); // yyyy-mm
      if (!map[monthStr]) {
        map[monthStr] = { revenue: 0, expenses: 0 };
      }
      if (tx.type === "Revenue") {
        map[monthStr].revenue += tx.amount;
      } else {
        map[monthStr].expenses += tx.amount;
      }
    });

    return Object.entries(map)
      .map(([month, val]) => ({
        month,
        revenue: val.revenue,
        expenses: val.expenses,
        net: val.revenue - val.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // Sync state with calculated data
  useEffect(() => {
    if (calculatedMonthly.length > 0) {
      setMonthlyList(calculatedMonthly);
    }
  }, [calculatedMonthly]);

  const formatCurrency = (val: number) => {
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: activeFile?.currency || "INR",
      maximumFractionDigits: 0,
    });
    return formatter.format(val);
  };

  const handleFieldChange = (idx: number, field: "revenue" | "expenses", valStr: string) => {
    const val = valStr === "" ? 0 : parseFloat(valStr);
    if (isNaN(val)) return;

    setMonthlyList((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: val,
        net: field === "revenue" ? val - copy[idx].expenses : copy[idx].revenue - val,
      };
      return copy;
    });
  };

  const handleRecalculate = () => {
    setMonthlyList(calculatedMonthly);
    toast.success("KPIs recalculated successfully from source ledger.");
  };

  if (isFileLoading || isTxnsLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Monthly summaries...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentFileId) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-sm mx-auto">
          <BarChart3 className="h-12 w-12 text-primary animate-pulse mb-4" />
          <h3 className="text-lg font-bold">No Active Workspace</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Please select an active ledger workspace on the dashboard to access monthly summary metrics.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 stage-enter">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Monthly Summaries</h1>
            <p className="text-sm text-muted-foreground mt-1">
              MoM ledger balances with inline simulation modeling inputs.
            </p>
          </div>
          <Button onClick={handleRecalculate} size="sm" variant="outline" className="gap-1.5 font-semibold">
            <RefreshCw className="h-4 w-4" />
            Recalculate from Ledger
          </Button>
        </div>

        {/* Monthly summaries grid */}
        {monthlyList.length > 0 ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {monthlyList.map((m, idx) => {
              const profit = m.net;
              const isProfitable = profit >= 0;

              return (
                <Card key={m.month} className="p-4 border border-border/60 bg-card space-y-3">
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-xs font-bold text-foreground font-mono uppercase">
                      {new Date(m.month + "-02").toLocaleString("default", { month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Revenue</Label>
                      <Input
                        type="number"
                        value={m.revenue}
                        onChange={(e) => handleFieldChange(idx, "revenue", e.target.value)}
                        className="h-8 text-xs px-2.5 font-semibold bg-muted/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Expenses</Label>
                      <Input
                        type="number"
                        value={m.expenses}
                        onChange={(e) => handleFieldChange(idx, "expenses", e.target.value)}
                        className="h-8 text-xs px-2.5 font-semibold bg-muted/20"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Profit</span>
                    <span className={cn("text-xs font-bold font-mono", isProfitable ? "text-emerald-500" : "text-destructive")}>
                      {formatCurrency(m.net)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border">
            No transaction records grouped by month detected in this ledger file.
          </Card>
        )}

        {/* Monthly Net Profit Trend Chart */}
        <Card className="p-5 border border-border/60 bg-card">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net Profit Trend</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Calculated net margins across months</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyList} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.1)" />
                <XAxis dataKey="month" stroke="rgba(120,120,120,0.6)" fontSize={9} tickLine={false} />
                <YAxis stroke="rgba(120,120,120,0.6)" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <ReferenceLine y={0} stroke="rgba(120,120,120,0.4)" strokeWidth={1} />
                <Bar
                  dataKey="net"
                  name="Net profit"
                  fill="#8B5CF6"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={30}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
