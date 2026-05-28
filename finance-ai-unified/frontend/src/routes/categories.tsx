import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceStore } from "@/lib/store";
import { useFile, useTransactions } from "@/lib/api";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Tag } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
});

const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#EF4444", "#06B6D4", "#84CC16"];

function CategoriesPage() {
  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const { data: fileData, isLoading: isFileLoading } = useFile(currentFileId);
  const { data: txnsData, isLoading: isTxnsLoading } = useTransactions(currentFileId, { page_size: 1000 });

  const activeFile = fileData?.metadata;
  const transactions = txnsData?.transactions ?? [];

  const formatCurrency = (val: number) => {
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: activeFile?.currency || "INR",
      maximumFractionDigits: 0,
    });
    return formatter.format(val);
  };

  const analysis = useMemo(() => {
    const revMap: Record<string, { amount: number; count: number }> = {};
    const expMap: Record<string, { amount: number; count: number }> = {};

    let totalRev = 0;
    let totalExp = 0;

    transactions.forEach((tx) => {
      const map = tx.type === "Revenue" ? revMap : expMap;
      if (tx.type === "Revenue") totalRev += tx.amount;
      else totalExp += tx.amount;

      if (!map[tx.category]) {
        map[tx.category] = { amount: 0, count: 0 };
      }
      map[tx.category].amount += tx.amount;
      map[tx.category].count += 1;
    });

    const revList = Object.entries(revMap).map(([category, val]) => ({
      category,
      amount: val.amount,
      count: val.count,
      pct: totalRev > 0 ? (val.amount / totalRev) * 100 : 0,
      type: "Revenue" as const,
    })).sort((a, b) => b.amount - a.amount);

    const expList = Object.entries(expMap).map(([category, val]) => ({
      category,
      amount: val.amount,
      count: val.count,
      pct: totalExp > 0 ? (val.amount / totalExp) * 100 : 0,
      type: "Expense" as const,
    })).sort((a, b) => b.amount - a.amount);

    return {
      revenueCategories: revList,
      expenseCategories: expList,
      totalRev,
      totalExp,
      tableData: [...revList, ...expList].sort((a, b) => b.amount - a.amount),
    };
  }, [transactions]);

  if (isFileLoading || isTxnsLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Category analysis...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentFileId) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-sm mx-auto">
          <Tag className="h-12 w-12 text-primary animate-pulse mb-4" />
          <h3 className="text-lg font-bold">No Active Workspace</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Please load a corporate ledger file on the dashboard to access category analysis.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 stage-enter">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Category Spend & Stream Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze business resource allocations across revenue channels and expense centers.
          </p>
        </div>

        {/* Donut Charts Side-by-Side */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Expenses Donut */}
          <Card className="p-5 border border-border/60 bg-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expense Categories</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Corporate spend distribution</p>
            </div>
            
            {analysis.expenseCategories.length > 0 ? (
              <div className="h-56 w-full my-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysis.expenseCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {analysis.expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center text-xs text-muted-foreground font-medium">
                No expense categories to display.
              </div>
            )}

            {/* Spend Legend List */}
            <div className="space-y-1.5 border-t border-border/40 pt-4">
              {analysis.expenseCategories.slice(0, 4).map((entry, idx) => (
                <div key={entry.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{entry.category}</span>
                  </div>
                  <span className="font-semibold text-foreground shrink-0">{formatCurrency(entry.amount)} ({entry.pct.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Revenue Donut */}
          <Card className="p-5 border border-border/60 bg-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue Streams</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Corporate income distribution</p>
            </div>
            
            {analysis.revenueCategories.length > 0 ? (
              <div className="h-56 w-full my-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysis.revenueCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {analysis.revenueCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center text-xs text-muted-foreground font-medium">
                No revenue streams to display.
              </div>
            )}

            {/* Income Legend List */}
            <div className="space-y-1.5 border-t border-border/40 pt-4">
              {analysis.revenueCategories.slice(0, 4).map((entry, idx) => (
                <div key={entry.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{entry.category}</span>
                  </div>
                  <span className="font-semibold text-foreground shrink-0">{formatCurrency(entry.amount)} ({entry.pct.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Category Breakdown Table */}
        <Card className="p-5 border border-border/60 bg-card space-y-4">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Breakdown Matrix</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Overview details of ledger categories</p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/60 font-semibold text-muted-foreground">
                  <th className="p-3">Category</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Total Volume</th>
                  <th className="p-3 text-center">Txns</th>
                  <th className="p-3 text-right">Share of Type</th>
                </tr>
              </thead>
              <tbody>
                {analysis.tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{row.category}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-bold leading-none uppercase",
                        row.type === "Revenue" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {row.type}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-foreground">{formatCurrency(row.amount)}</td>
                    <td className="p-3 text-center font-mono text-muted-foreground">{row.count}</td>
                    <td className="p-3 text-right font-mono font-semibold text-muted-foreground">{row.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
