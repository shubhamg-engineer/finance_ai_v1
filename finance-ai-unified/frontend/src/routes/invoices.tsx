import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useInvoices, apiExt, Invoice } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText, Upload, Plus, CheckCircle2, XCircle, AlertTriangle, Edit3, Save, X, Trash2, Bot
} from "lucide-react";
import { useState, useRef } from "react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/invoices")({ component: InvoicesPage });

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  posted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

function InvoiceRow({ inv, onUpdate, onDelete }: { inv: Invoice; onUpdate: (id: string, data: Partial<Invoice>) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...inv });

  const save = () => {
    onUpdate(inv.id, form);
    setEditing(false);
  };

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all",
      inv.is_duplicate_flag ? "border-red-500/30 bg-red-500/5" : "border-border/50 hover:bg-muted/10"
    )}>
      {editing ? (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
          <div><p className="text-[9px] text-muted-foreground mb-0.5">Vendor</p><Input className="h-7 text-xs" value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} /></div>
          <div><p className="text-[9px] text-muted-foreground mb-0.5">Invoice #</p><Input className="h-7 text-xs" value={form.invoice_number ?? ""} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} /></div>
          <div><p className="text-[9px] text-muted-foreground mb-0.5">Amount (₹)</p><Input className="h-7 text-xs" type="number" value={form.amount_inr} onChange={e => setForm(f => ({ ...f, amount_inr: parseFloat(e.target.value) }))} /></div>
          <div><p className="text-[9px] text-muted-foreground mb-0.5">Category</p><Input className="h-7 text-xs" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
          <div><p className="text-[9px] text-muted-foreground mb-0.5">Invoice Date</p><Input className="h-7 text-xs" value={form.invoice_date ?? ""} onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))} /></div>
          <div><p className="text-[9px] text-muted-foreground mb-0.5">Due Date</p><Input className="h-7 text-xs" value={form.due_date ?? ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
          <div><p className="text-[9px] text-muted-foreground mb-0.5">GST No.</p><Input className="h-7 text-xs" value={form.gst_number ?? ""} onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))} /></div>
          <div><p className="text-[9px] text-muted-foreground mb-0.5">Notes</p><Input className="h-7 text-xs" value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="col-span-full flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={save}><Save className="h-3 w-3 mr-1" />Save</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(false)}><X className="h-3 w-3 mr-1" />Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {inv.is_duplicate_flag && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" title="Possible duplicate" />}
          <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-0.5">
            <div className="col-span-1">
              <p className="text-xs font-semibold truncate">{inv.vendor_name}</p>
              <p className="text-[9px] text-muted-foreground">{inv.invoice_number || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">₹{inv.amount_inr.toLocaleString("en-IN")}</p>
              {inv.gst_amount ? <p className="text-[9px] text-muted-foreground">GST: ₹{inv.gst_amount.toLocaleString("en-IN")}</p> : null}
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] text-muted-foreground">{inv.category}</p>
              <p className="text-[9px] text-muted-foreground">{inv.invoice_date || "—"} → {inv.due_date || "—"}</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] text-muted-foreground truncate">{inv.notes || "—"}</p>
            </div>
            <div className="hidden sm:flex items-center gap-1 flex-wrap">
              <Badge className={cn("text-[9px] border", statusColor[inv.status] || "bg-muted")}>{inv.status}</Badge>
              {inv.is_duplicate_flag && <Badge className="text-[9px] border-red-500/20 bg-red-500/10 text-red-500">Duplicate?</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <select
              value={inv.status}
              onChange={e => onUpdate(inv.id, { status: e.target.value })}
              className="text-[10px] bg-background border border-border/60 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {["pending","approved","posted","rejected"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-muted transition-colors"><Edit3 className="h-3.5 w-3.5 text-muted-foreground" /></button>
            <button onClick={() => onDelete(inv.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-500/70" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoicesPage() {
  const { data: invoices, isLoading } = useInvoices();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all");

  const refresh = () => qc.invalidateQueries({ queryKey: ["invoices"] });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await apiExt.uploadInvoice(file);
      toast.success(`Invoice extracted: ${res.invoice.vendor_name}${res.is_duplicate ? " ⚠ Possible duplicate" : ""}`);
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Invoice>) => {
    try {
      await apiExt.updateInvoice(id, data);
      toast.success("Invoice updated");
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiExt.deleteInvoice(id);
      toast.success("Invoice deleted");
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = (invoices ?? []).filter(inv => filter === "all" || inv.status === filter);
  const totalPending = (invoices ?? []).filter(i => i.status === "pending").reduce((s, i) => s + i.amount_inr, 0);
  const duplicates = (invoices ?? []).filter(i => i.is_duplicate_flag).length;

  return (
    <AppLayout>
      <Toaster richColors position="top-right" />
      <div className="space-y-6 stage-enter">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Invoice Automation</h1>
            <p className="text-xs text-muted-foreground mt-1">AI OCR extraction · Duplicate detection · Ledger auto-post</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv,.txt,.json,.xlsx" className="hidden"
              onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Bot className="h-3.5 w-3.5 mr-1.5 text-primary" />
              {uploading ? "Extracting..." : "AI Extract Invoice"}
            </Button>
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />Upload
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Invoices", val: String(invoices?.length ?? 0), color: "text-primary" },
            { label: "Pending Amount", val: `₹${(totalPending / 100000).toFixed(2)}L`, color: "text-amber-500" },
            { label: "Approved", val: String((invoices ?? []).filter(i => i.status === "approved").length), color: "text-emerald-500" },
            { label: "Duplicates Flagged", val: String(duplicates), color: "text-red-500" },
          ].map(k => (
            <Card key={k.label} className="p-4 border border-border/60">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p>
              <p className={cn("text-xl font-bold mt-1", k.color)}>{k.val}</p>
            </Card>
          ))}
        </div>

        {/* Filter + List */}
        <Card className="p-5 border border-border/60 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Invoice Register</span>
            <div className="ml-auto flex gap-1">
              {["all", "pending", "approved", "posted", "rejected"].map(s => (
                <button key={s} onClick={() => setFilter(s)} className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-all capitalize",
                  filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Loading invoices...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">No invoices yet. Upload a file or use AI Extract.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(inv => (
                <InvoiceRow key={inv.id} inv={inv} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
