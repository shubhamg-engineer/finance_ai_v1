import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceStore } from "@/lib/store";
import { useFile, useTransactions, Transaction } from "@/lib/api";
import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Activity, Calendar as CalendarIcon, ArrowRight, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/daily")({
  component: DailySpendingPage,
});

function DailySpendingPage() {
  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const { data: fileData, isLoading: isFileLoading } = useFile(currentFileId);
  const { data: txnsData, isLoading: isTxnsLoading } = useTransactions(currentFileId, { page_size: 1000 });

  const activeFile = fileData?.metadata;
  const transactions = txnsData?.transactions ?? [];

  // Default to showing the month of the last transaction
  const lastTxDate = useMemo(() => {
    if (transactions.length === 0) return new Date();
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    return new Date(sorted[sorted.length - 1].date);
  }, [transactions]);

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Sync to last transaction month once transactions load
  useEffect(() => {
    if (transactions.length > 0) {
      const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
      const last = new Date(sorted[sorted.length - 1].date + "T12:00:00");
      setCurrentDate(last);
    }
  }, [transactions.length]);

  const formatCurrency = (val: number) => {
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: activeFile?.currency || "INR",
      maximumFractionDigits: 0,
    });
    return formatter.format(val);
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Days in month calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Group transactions by date
  const groupedTxns = useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number; list: Transaction[] }> = {};
    transactions.forEach((tx) => {
      const dateStr = tx.date;
      if (!map[dateStr]) {
        map[dateStr] = { revenue: 0, expenses: 0, list: [] };
      }
      if (tx.type === "Revenue") {
        map[dateStr].revenue += tx.amount;
      } else {
        map[dateStr].expenses += tx.amount;
      }
      map[dateStr].list.push(tx);
    });
    return map;
  }, [transactions]);

  // Selected date transactions
  const selectedDayData = selectedDateStr ? groupedTxns[selectedDateStr] : null;

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDateStr(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDateStr(null);
  };

  const monthLabel = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  // Generate calendar days
  const calendarCells = useMemo(() => {
    const cells = [];
    // Padding for empty cells before first day
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, dateStr: null });
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr });
    }
    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex]);

  // Cash flow trend for the last 30 days
  const dailyBarChartData = useMemo(() => {
    if (transactions.length === 0) return [];
    // Get unique sorted dates of last 30 transaction dates
    const allDates = Array.from(new Set(transactions.map((t) => t.date))).sort();
    const targetDates = allDates.slice(-30);

    return targetDates.map((dateStr) => {
      const data = groupedTxns[dateStr] ?? { revenue: 0, expenses: 0 };
      return {
        date: dateStr.slice(5), // mm-dd
        Revenue: data.revenue,
        Expenses: data.expenses,
        Net: data.revenue - data.expenses,
      };
    });
  }, [transactions, groupedTxns]);

  if (isFileLoading || isTxnsLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Daily spending...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentFileId) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-sm mx-auto">
          <CalendarIcon className="h-12 w-12 text-primary animate-pulse mb-4" />
          <h3 className="text-lg font-bold">No Active Workspace</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Please load a corporate financials file from the dashboard to explore daily spending logs.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 stage-enter">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Spending Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reconcile daily inflows and outflows using an interactive cash calendar.
          </p>
        </div>

        {/* Calendar Card */}
        <Card className="p-5 border border-border/60 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-4.5 w-4.5 text-primary" />
              {monthLabel}
            </h3>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[10px] text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              const hasData = cell.dateStr && groupedTxns[cell.dateStr];
              const isSelected = selectedDateStr === cell.dateStr;
              const data = cell.dateStr ? groupedTxns[cell.dateStr] : null;

              return (
                <div
                  key={idx}
                  onClick={() => cell.dateStr && setSelectedDateStr(cell.dateStr)}
                  className={cn(
                    "min-h-16 p-2 rounded-lg border flex flex-col justify-between text-left transition-all relative overflow-hidden select-none",
                    cell.day ? "border-border/60 bg-card/50 cursor-pointer hover:border-primary/50 hover:bg-muted/20" : "border-transparent bg-transparent pointer-events-none",
                    isSelected && "border-primary bg-primary/5 shadow-inner"
                  )}
                >
                  {cell.day && (
                    <>
                      <span className="text-[10px] font-bold text-foreground">{cell.day}</span>
                      {data && (
                        <div className="space-y-0.5 mt-1">
                          {data.revenue > 0 && (
                            <p className="text-[9px] font-bold text-emerald-500 leading-tight">+{formatCurrency(data.revenue)}</p>
                          )}
                          {data.expenses > 0 && (
                            <p className="text-[9px] font-bold text-destructive leading-tight">-{formatCurrency(data.expenses)}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected Day Details */}
        {selectedDateStr && (
          <Card className="p-5 border border-border/60 bg-card space-y-4 stage-enter">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Transactions on {selectedDateStr}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDayData?.list.length ?? 0} transaction{selectedDayData?.list.length !== 1 ? "s" : ""} recorded
                </p>
              </div>
              {selectedDayData && (
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    Inflow: {formatCurrency(selectedDayData.revenue)}
                  </Badge>
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    Outflow: {formatCurrency(selectedDayData.expenses)}
                  </Badge>
                </div>
              )}
            </div>

            {selectedDayData && selectedDayData.list.length > 0 ? (
              <div className="space-y-2">
                {selectedDayData.list.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground truncate">{tx.category}</span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-bold leading-none uppercase",
                          tx.type === "Revenue" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {tx.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{tx.description || "No description provided."}</p>
                    </div>
                    <span className={cn("text-xs font-bold shrink-0", tx.type === "Revenue" ? "text-emerald-500" : "text-destructive")}>
                      {tx.type === "Revenue" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No ledger logs for this date.</p>
            )}
          </Card>
        )}

        {/* Chart */}
        <Card className="p-5 border border-border/60 bg-card">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Daily Cash Flow</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">30 active transactional days cash movement</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBarChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.1)" />
                <XAxis dataKey="date" stroke="rgba(120,120,120,0.6)" fontSize={9} tickLine={false} />
                <YAxis stroke="rgba(120,120,120,0.6)" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }} />
                <Bar dataKey="Revenue" fill="#10B981" radius={[2, 2, 0, 0]} maxBarSize={15} />
                <Bar dataKey="Expenses" fill="#EF4444" radius={[2, 2, 0, 0]} maxBarSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
