import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTaxCalendar } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Scale, Calendar, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Globe } from "lucide-react";

export const Route = createFileRoute("/compliance")({ component: CompliancePage });

const jurisdictionColor: Record<string, string> = {
  India: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  USA: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  EU: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  UK: "text-violet-500 bg-violet-500/10 border-violet-500/20",
};

const priorityColor: Record<string, string> = {
  CRITICAL: "text-red-500 bg-red-500/10 border-red-500/20",
  HIGH: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  MEDIUM: "text-blue-500 bg-blue-500/10 border-blue-500/20",
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function CompliancePage() {
  const { data: cal } = useTaxCalendar();

  return (
    <AppLayout>
      <div className="space-y-6 stage-enter">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global Compliance & Tax Calendar</h1>
          <p className="text-xs text-muted-foreground mt-1">India · USA · EU · UK — Multi-jurisdiction regulatory tracker</p>
        </div>

        {/* Audit Readiness Score */}
        {cal && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5 border border-border/60 flex flex-col items-center justify-center text-center gap-2">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-3xl font-extrabold text-emerald-500">{cal.audit_readiness.score}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{cal.audit_readiness.label} · Audit Readiness</p>
              </div>
            </Card>
            <Card className="p-5 border border-border/60 space-y-2 col-span-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Audit Checklist</p>
              <div className="grid grid-cols-2 gap-2">
                {cal.audit_readiness.checklist.map((c, i) => (
                  <div key={i} className={cn("flex items-center gap-2 p-2 rounded-lg border text-xs", c.done ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")}>
                    {c.done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                    <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Tax Calendar */}
        <Card className="p-5 border border-border/60 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Upcoming Tax Deadlines</span>
          </div>
          <div className="space-y-2">
            {(cal?.deadlines ?? []).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map((d, i) => {
              const days = daysUntil(d.due_date);
              const isUrgent = days <= 7;
              return (
                <div key={i} className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border transition-all hover:bg-muted/20",
                  isUrgent ? "border-red-500/30 bg-red-500/5" : "border-border/50"
                )}>
                  <div className="flex flex-col items-center justify-center w-14 shrink-0">
                    <p className={cn("text-lg font-extrabold leading-none", days <= 0 ? "text-red-500" : days <= 7 ? "text-amber-500" : "text-foreground")}>{Math.max(0, days)}</p>
                    <p className="text-[9px] text-muted-foreground">days</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{d.task}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[9px] text-muted-foreground">{d.due_date}</span>
                      <span className="text-[9px] text-muted-foreground">·</span>
                      <span className="text-[9px] text-muted-foreground">Penalty: {d.penalty}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn("text-[9px] border", jurisdictionColor[d.jurisdiction] || "bg-muted")}>{d.jurisdiction}</Badge>
                    <Badge className={cn("text-[9px] border", priorityColor[d.priority] || "bg-muted")}>{d.priority}</Badge>
                    <Badge variant="outline" className="text-[9px]">{d.category}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* GST Reconciliation */}
        {cal && (
          <Card className="p-5 border border-border/60 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GST Reconciliation Status</span>
              <Badge className={cn("ml-auto text-[9px]", cal.gst_reconciliation.variance_inr > 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")}>
                {cal.gst_reconciliation.variance_inr > 0 ? "Variance Detected" : "Reconciled"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "GSTR-1 Filed", val: cal.gst_reconciliation.gstr1_filed, type: "bool" },
                { label: "GSTR-2B Available", val: cal.gst_reconciliation.gstr2b_available, type: "bool" },
                { label: "GSTR-3B Filed", val: cal.gst_reconciliation.gstr3b_filed, type: "bool" },
                { label: "ITC Available", val: `₹${(cal.gst_reconciliation.itc_available_inr / 1000).toFixed(1)}K`, type: "text" },
                { label: "ITC Claimed", val: `₹${(cal.gst_reconciliation.itc_claimed_inr / 1000).toFixed(1)}K`, type: "text" },
                { label: "Variance", val: `₹${(cal.gst_reconciliation.variance_inr / 1000).toFixed(1)}K`, type: "warning" },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg border border-border/50 space-y-1">
                  <p className="text-[9px] text-muted-foreground">{item.label}</p>
                  {item.type === "bool"
                    ? <p className={cn("text-xs font-bold", item.val ? "text-emerald-500" : "text-red-500")}>{item.val ? "✓ Done" : "✗ Pending"}</p>
                    : <p className={cn("text-xs font-bold", item.type === "warning" && (item.val as string).includes("K") ? "text-amber-500" : "text-foreground")}>{item.val}</p>
                  }
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-500 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              {cal.gst_reconciliation.status}
            </p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
