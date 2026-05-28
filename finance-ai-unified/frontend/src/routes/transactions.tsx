import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceStore } from "@/lib/store";
import { useTransactions, api } from "@/lib/api";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  FileDown,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileText,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const currentFileId = useFinanceStore((s) => s.currentFileId);
  const queryClient = useQueryClient();

  // Filters and Pagination states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Fetch transactions
  const { data, isLoading, refetch } = useTransactions(currentFileId, {
    page,
    page_size: pageSize,
    search: searchTerm,
    type_filter: typeFilter,
    category_filter: categoryFilter,
  });

  // Editing states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<"Revenue" | "Expense">("Revenue");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editCategory, setEditCategory] = useState("");
  const [editVendor, setEditVendor] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMethod, setEditMethod] = useState("NEFT");
  const [editRisk, setEditRisk] = useState("Low");

  // Adding states
  const [isAdding, setIsAdding] = useState(false);
  const [addDate, setAddDate] = useState(new Date().toISOString().split("T")[0]);
  const [addType, setAddType] = useState<"Revenue" | "Expense">("Revenue");
  const [addAmount, setAddAmount] = useState<number>(0);
  const [addCategory, setAddCategory] = useState("");
  const [addVendor, setAddVendor] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addMethod, setAddMethod] = useState("NEFT");
  const [addRisk, setAddRisk] = useState("Low");

  // Mutations
  const editMutation = useMutation({
    mutationFn: ({ txId, payload }: { txId: number; payload: any }) =>
      api.editTransaction(currentFileId!, txId, payload),
    onSuccess: () => {
      toast.success("Transaction updated successfully!");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["transactions", currentFileId] });
      queryClient.invalidateQueries({ queryKey: ["file", currentFileId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update transaction");
    },
  });

  const addMutation = useMutation({
    mutationFn: (payload: any) => api.addTransaction(currentFileId!, payload),
    onSuccess: () => {
      toast.success("Transaction added successfully!");
      setIsAdding(false);
      setAddDate(new Date().toISOString().split("T")[0]);
      setAddType("Revenue");
      setAddAmount(0);
      setAddCategory("");
      setAddVendor("");
      setAddDescription("");
      setAddMethod("NEFT");
      setAddRisk("Low");
      queryClient.invalidateQueries({ queryKey: ["transactions", currentFileId] });
      queryClient.invalidateQueries({ queryKey: ["file", currentFileId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add transaction");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (txId: number) => api.deleteTransaction(currentFileId!, txId),
    onSuccess: () => {
      toast.success("Transaction deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["transactions", currentFileId] });
      queryClient.invalidateQueries({ queryKey: ["file", currentFileId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete transaction");
    },
  });

  if (!currentFileId) {
    return (
      <AppLayout>
        <div className="flex h-[70vh] flex-col items-center justify-center text-center max-w-md mx-auto px-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
            <FileText className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">No Active Workspace</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Please upload or select a financial ledger file before accessing the transaction editor.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Upload Ledger File
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const startEdit = (tx: any) => {
    setEditingId(tx.id);
    setEditDate(tx.date);
    setEditType(tx.type);
    setEditAmount(tx.amount);
    setEditCategory(tx.category);
    setEditVendor(tx.vendor || "");
    setEditDescription(tx.description || "");
    setEditMethod(tx.method || "NEFT");
    setEditRisk(tx.risk || "Low");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (txId: number) => {
    if (!editDate || !editCategory || editAmount <= 0) {
      toast.error("Please fill in Date, Category, and a positive Amount");
      return;
    }
    editMutation.mutate({
      txId,
      payload: {
        date: editDate,
        type: editType,
        amount: Number(editAmount),
        category: editCategory,
        vendor: editVendor,
        description: editDescription,
        method: editMethod,
        risk: editRisk,
      },
    });
  };

  const saveAdd = () => {
    if (!addDate || !addCategory || addAmount <= 0) {
      toast.error("Please fill in Date, Category, and a positive Amount");
      return;
    }
    addMutation.mutate({
      date: addDate,
      type: addType,
      amount: Number(addAmount),
      category: addCategory,
      vendor: addVendor,
      description: addDescription,
      method: addMethod,
      risk: addRisk,
    });
  };

  const handleDelete = (txId: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate(txId);
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      const allTxRes = await api.getTransactions(currentFileId, { page_size: 10000 });
      const txs = allTxRes.transactions;
      
      const headers = ["Date", "Type", "Amount", "Category", "Vendor/Client", "Description", "Method", "Risk", "Edited"];
      const csvRows = [headers.join(",")];
      
      txs.forEach((t) => {
        const row = [
          t.date,
          t.type,
          t.amount,
          `"${t.category.replace(/"/g, '""')}"`,
          `"${(t.vendor || "").replace(/"/g, '""')}"`,
          `"${(t.description || "").replace(/"/g, '""')}"`,
          t.method || "—",
          t.risk || "Low",
          t.is_edited ? "Yes" : "No",
        ];
        csvRows.push(row.join(","));
      });
      
      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Workspace_Ledger_${currentFileId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV file exported successfully!");
    } catch (e: any) {
      toast.error("Failed to export: " + e.message);
    }
  };

  return (
    <AppLayout>
      <Toaster position="top-right" richColors />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workspace Ledger</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add, update, or delete transaction records. Edited values automatically re-trigger local metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5"
              size="sm"
            >
              {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isAdding ? "Cancel" : "Add Record"}
            </Button>
          </div>
        </div>

        {/* Adding inline row card */}
        {isAdding && (
          <Card className="p-4 border-primary/20 bg-primary/5 space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">New Transaction Record</h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Date</label>
                <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Type</label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1 focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
                >
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Amount (₹)</label>
                <Input type="number" min="0" value={addAmount} onChange={(e) => setAddAmount(Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Category</label>
                <Input type="text" placeholder="e.g. Management Fees" value={addCategory} onChange={(e) => setAddCategory(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Vendor / Client</label>
                <Input type="text" placeholder="e.g. Stellar Growth Fund" value={addVendor} onChange={(e) => setAddVendor(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Description</label>
                <Input type="text" placeholder="Transaction details" value={addDescription} onChange={(e) => setAddDescription(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Method</label>
                <select
                  value={addMethod}
                  onChange={(e) => setAddMethod(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1 focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
                >
                  <option>NEFT</option>
                  <option>RTGS</option>
                  <option>UPI</option>
                  <option>Cheque</option>
                  <option>Card</option>
                  <option>Internal</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Risk</label>
                <select
                  value={addRisk}
                  onChange={(e) => setAddRisk(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1 focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={saveAdd} disabled={addMutation.isPending}>
                <Save className="h-3.5 w-3.5 mr-1" /> Save Record
              </Button>
            </div>
          </Card>
        )}

        {/* Toolbar & Filters */}
        <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search description/category..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-xs"
              />
            </div>

            {/* Type dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-background border border-border/80 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </select>
            </div>

            {/* Category selection */}
            {data?.categories && data.categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-background border border-border/80 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary max-w-xs cursor-pointer"
              >
                <option value="">All Categories</option>
                {data.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Txs Found: <span className="font-semibold text-foreground">{data?.total || 0}</span>
          </div>
        </Card>

        {/* Main Data Table */}
        <Card className="overflow-hidden border border-border/50">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
                Fetching ledger transactions...
              </div>
            ) : data?.transactions && data.transactions.length > 0 ? (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="p-3 whitespace-nowrap">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Vendor / Client</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Risk</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((tx) => {
                    const isEditing = editingId === tx.id;
                    return (
                      <tr key={tx.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                        {isEditing ? (
                          <>
                            <td className="p-2">
                              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 py-0 px-2 text-xs" />
                            </td>
                            <td className="p-2">
                              <select
                                value={editType}
                                onChange={(e) => setEditType(e.target.value as any)}
                                className="h-8 rounded border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
                              >
                                <option value="Revenue">Revenue</option>
                                <option value="Expense">Expense</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="h-8 py-0 px-2 text-xs" />
                            </td>
                            <td className="p-2">
                              <Input type="number" min="0" value={editAmount} onChange={(e) => setEditAmount(Number(e.target.value))} className="h-8 py-0 px-2 text-xs text-right font-mono font-bold" />
                            </td>
                            <td className="p-2">
                              <Input value={editVendor} onChange={(e) => setEditVendor(e.target.value)} className="h-8 py-0 px-2 text-xs" placeholder="Vendor / Client" />
                            </td>
                            <td className="p-2">
                              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="h-8 py-0 px-2 text-xs" placeholder="Description" />
                            </td>
                            <td className="p-2">
                              <select
                                value={editMethod}
                                onChange={(e) => setEditMethod(e.target.value)}
                                className="h-8 rounded border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary text-foreground cursor-pointer font-mono"
                              >
                                <option>NEFT</option>
                                <option>RTGS</option>
                                <option>UPI</option>
                                <option>Cheque</option>
                                <option>Card</option>
                                <option>Internal</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={editRisk}
                                onChange={(e) => setEditRisk(e.target.value)}
                                className="h-8 rounded border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary text-foreground cursor-pointer font-bold"
                              >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                              </select>
                            </td>
                            <td className="p-2 text-right space-x-1.5 whitespace-nowrap">
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 w-7 p-0 rounded-full text-muted-foreground">
                                <X className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" onClick={() => saveEdit(tx.id)} disabled={editMutation.isPending} className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Save className="h-3 w-3 mr-1" /> Save
                              </Button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-medium text-foreground whitespace-nowrap">{tx.date}</td>
                            <td className="p-3">
                              <Badge
                                variant={tx.type === "Revenue" ? "secondary" : "outline"}
                                className={cn(
                                  "text-[10px] px-2 py-0.5",
                                  tx.type === "Revenue" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                )}
                              >
                                {tx.type}
                              </Badge>
                            </td>
                            <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                              {tx.category}
                              {tx.is_edited && (
                                <span className="ml-1.5 text-[9px] text-primary bg-primary/5 px-1 py-0.5 rounded border border-primary/20">Edited</span>
                              )}
                            </td>
                            <td className={cn("p-3 font-mono font-bold text-right whitespace-nowrap", tx.type === "Revenue" ? "text-emerald-500" : "text-destructive")}>
                              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(tx.amount)}
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                              {tx.vendor || "—"}
                            </td>
                            <td className="p-3 text-muted-foreground truncate max-w-[200px]" title={tx.description}>
                              {tx.description || "—"}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {tx.method ? (
                                <span className="inline-flex items-center rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[9px] font-semibold font-mono text-muted-foreground uppercase">
                                  {tx.method}
                                </span>
                              ) : "—"}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {tx.risk ? (
                                <span className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border",
                                  tx.risk === "Low" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                  tx.risk === "Medium" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                  tx.risk === "High" && "bg-red-500/10 text-red-500 border-red-500/20"
                                )}>
                                  {tx.risk}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Low</span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <Button size="sm" variant="ghost" onClick={() => startEdit(tx)} className="h-7 w-7 p-0 rounded-full hover:bg-muted text-muted-foreground">
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(tx.id)} className="h-7 w-7 p-0 rounded-full hover:bg-red-500/10 text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center text-xs text-muted-foreground">
                No matching transactions found in this workspace file.
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {data && data.total > pageSize && (
            <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> of{" "}
                <span className="font-semibold text-foreground">{Math.ceil(data.total / pageSize)}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(Math.ceil(data.total / pageSize), page + 1))}
                disabled={page === Math.ceil(data.total / pageSize)}
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
