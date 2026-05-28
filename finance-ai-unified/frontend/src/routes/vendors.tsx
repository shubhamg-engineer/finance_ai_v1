import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useVendors, apiExt, Vendor } from "@/lib/api";
import { useFinanceStore as useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Target, Edit3, Save, X, CheckCircle2, AlertTriangle, ShieldCheck, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/vendors")({ component: VendorsPage });

const riskConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  Low: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  Medium: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: <AlertTriangle className="h-3 w-3" /> },
  High: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <AlertTriangle className="h-3 w-3" /> },
  Critical: { color: "bg-red-600/15 text-red-600 border-red-600/30", icon: <AlertTriangle className="h-3 w-3" /> },
};

function VendorRow({ v, onUpdate, onDelete }: { v: Vendor; onUpdate: (name: string, data: Partial<Vendor>) => void; onDelete: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...v });

  const risk = riskConfig[v.risk_level] ?? riskConfig.Low;
  const maxConc = 50;
  const concWidth = Math.min(v.concentration_pct, maxConc) / maxConc * 100;

  const save = () => { onUpdate(v.vendor_name, form); setEditing(false); };

  return (
    <div className="p-3 rounded-lg border border-border/50 hover:bg-muted/10 transition-all space-y-2">
      {editing ? (
        <div className="grid gap-2 sm:grid-cols-4">
          <div><p className="text-[9px] text-muted-foreground mb-0.5">Category</p><Input className="h-7 text-xs" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
          <div><p className="text-[9px] text-muted-foreground mb-0.5">GST No.</p><Input className="h-7 text-xs" value={form.gst_number ?? ""} onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))} /></div>
          <div><p className="text-[9px] text-muted-foreground mb-0.5">Payment Terms</p><Input className="h-7 text-xs" value={form.payment_terms ?? ""} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} /></div>
          <div>
            <p className="text-[9px] text-muted-foreground mb-0.5">Risk Override</p>
            <select className="w-full text-xs bg-background border border-border/60 rounded px-2 py-1.5 h-7 focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.risk_level} onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))}>
              {["Low", "Medium", "High", "Critical"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-span-full"><p className="text-[9px] text-muted-foreground mb-0.5">Notes</p><Input className="h-7 text-xs" value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="col-span-full flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={form.is_verified} onChange={e => setForm(f => ({ ...f, is_verified: e.target.checked }))} className="rounded" />
              Mark as Verified
            </label>
            <Button size="sm" className="h-7 text-xs ml-auto" onClick={save}><Save className="h-3 w-3 mr-1" />Save</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(false)}><X className="h-3 w-3 mr-1" />Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold truncate">{v.vendor_name}</p>
              {v.is_verified && <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" title="Verified" />}
            </div>
            <p className="text-[10px] text-muted-foreground">{v.category} · {v.transaction_count} txns · {v.payment_terms || "No payment terms"}</p>
            {/* Concentration bar */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${concWidth}%`, backgroundColor: v.concentration_pct > 40 ? "#ef4444" : v.concentration_pct > 20 ? "#f59e0b" : "#10b981" }} />
              </div>
              <span className="text-[9px] text-muted-foreground shrink-0">{v.concentration_pct}% of spend</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold">₹{(v.total_spend_inr / 100000).toFixed(2)}L</p>
            <p className="text-[10px] text-muted-foreground">${v.total_spend_usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn("text-[9px] border flex items-center gap-1", risk.color)}>{risk.icon}{v.risk_level}</Badge>
            {v.gst_number && <Badge variant="outline" className="text-[9px] font-mono">{v.gst_number}</Badge>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Edit Vendor">
              <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => onDelete(v.vendor_name)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors" title="Delete Vendor">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      {v.notes && !editing && <p className="text-[10px] text-muted-foreground pl-1 border-l-2 border-primary/30 italic">{v.notes}</p>}
    </div>
  );
}

function VendorsPage() {
  const currentFileId = useStore(s => s.currentFileId);
  const { data, isLoading } = useVendors(currentFileId ?? undefined);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState({
    vendor_name: "",
    category: "",
    risk_level: "Low",
    gst_number: "",
    payment_terms: "",
    notes: "",
    is_verified: false,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["vendors"] });

  const handleUpdate = async (name: string, formData: Partial<Vendor>) => {
    try {
      await apiExt.updateVendor(name, formData);
      toast.success("Vendor updated");
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAdd = async () => {
    if (!newForm.vendor_name.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    try {
      await apiExt.addVendor(newForm);
      toast.success("Vendor added successfully");
      setShowAddForm(false);
      setNewForm({
        vendor_name: "",
        category: "",
        risk_level: "Low",
        gst_number: "",
        payment_terms: "",
        notes: "",
        is_verified: false,
      });
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to add vendor");
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${name}"?`)) return;
    try {
      await apiExt.deleteVendor(name);
      toast.success("Vendor deleted");
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete vendor");
    }
  };

  const filtered = (data?.vendors ?? []).filter(v =>
    v.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  const criticalVendors = (data?.vendors ?? []).filter(v => v.risk_level === "Critical" || v.risk_level === "High");

  return (
    <AppLayout>
      <Toaster richColors position="top-right" />
      <div className="space-y-6 stage-enter">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendor Intelligence</h1>
          <p className="text-xs text-muted-foreground mt-1">Spend concentration · Risk scoring · GST verification · Editable records</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Vendors", val: String(data?.vendors?.length ?? 0), color: "text-primary" },
            { label: "Total Spend (INR)", val: data ? `₹${(data.total_expense_inr / 100000).toFixed(2)}L` : "—", color: "text-foreground" },
            { label: "High Risk Vendors", val: String(criticalVendors.length), color: "text-red-500" },
            { label: "Verified Vendors", val: String((data?.vendors ?? []).filter(v => v.is_verified).length), color: "text-emerald-500" },
          ].map(k => (
            <Card key={k.label} className="p-4 border border-border/60">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p>
              <p className={cn("text-xl font-bold mt-1", k.color)}>{k.val}</p>
            </Card>
          ))}
        </div>

        {/* Critical Warning */}
        {criticalVendors.length > 0 && (
          <Card className="p-4 border border-red-500/20 bg-red-500/5 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-500">Vendor Concentration Risk</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {criticalVendors.map(v => v.vendor_name).join(", ")} account{criticalVendors.length > 1 ? "" : "s"} for a high share of total spend.
                Consider diversifying vendor relationships to reduce concentration risk.
              </p>
            </div>
          </Card>
        )}

        {/* Vendor List */}
        <Card className="p-5 border border-border/60 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vendor Register</span>
            
            <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-3 w-3 mr-1" />
              {showAddForm ? "Cancel" : "Add Vendor"}
            </Button>

            <Input
              className="max-w-[200px] h-7 text-xs ml-2"
              placeholder="Search vendors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Add Vendor Form */}
          {showAddForm && (
            <Card className="p-4 border border-primary/20 bg-primary/5 space-y-3">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Add Manual Vendor</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-[9px] text-muted-foreground mb-0.5">Vendor Name *</p>
                  <Input className="h-7 text-xs bg-background" value={newForm.vendor_name} onChange={e => setNewForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="e.g. Stripe" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground mb-0.5">Category</p>
                  <Input className="h-7 text-xs bg-background" value={newForm.category} onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Payment Processor" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground mb-0.5">Risk Level</p>
                  <select className="w-full text-xs bg-background border border-border/60 rounded px-2 py-1.5 h-7 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={newForm.risk_level} onChange={e => setNewForm(f => ({ ...f, risk_level: e.target.value }))}>
                    {["Low", "Medium", "High", "Critical"].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground mb-0.5">GST Number</p>
                  <Input className="h-7 text-xs bg-background" value={newForm.gst_number} onChange={e => setNewForm(f => ({ ...f, gst_number: e.target.value }))} placeholder="e.g. 27AAAAA0000A1Z5" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground mb-0.5">Payment Terms</p>
                  <Input className="h-7 text-xs bg-background" value={newForm.payment_terms} onChange={e => setNewForm(f => ({ ...f, payment_terms: e.target.value }))} placeholder="e.g. Net 30" />
                </div>
                <div className="col-span-full">
                  <p className="text-[9px] text-muted-foreground mb-0.5">Notes</p>
                  <Input className="h-7 text-xs bg-background" value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional vendor context..." />
                </div>
                <div className="col-span-full flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={newForm.is_verified} onChange={e => setNewForm(f => ({ ...f, is_verified: e.target.checked }))} className="rounded" />
                    Mark as Verified
                  </label>
                  <Button size="sm" className="h-7 text-xs ml-auto" onClick={handleAdd}><Save className="h-3 w-3 mr-1" />Add Vendor</Button>
                </div>
              </div>
            </Card>
          )}

          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Loading vendors...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No vendors found. Run the AI pipeline first or add one manually.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(v => <VendorRow key={v.vendor_name} v={v} onUpdate={handleUpdate} onDelete={handleDelete} />)}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

