import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { usePreferences, api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  HelpCircle,
  Building,
  Scale,
  Percent,
  CheckCircle,
  Save,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: preferences, isLoading } = usePreferences();

  // Local form states
  const [riskAppetite, setRiskAppetite] = useState("");
  const [growthFocus, setGrowthFocus] = useState("");
  const [reinvestmentRatio, setReinvestmentRatio] = useState("");
  const [debtAppetite, setDebtAppetite] = useState("");
  const [primaryCurrency, setPrimaryCurrency] = useState("");
  const [industry, setIndustry] = useState("");

  // Sync loaded preferences with state
  useEffect(() => {
    if (preferences) {
      setRiskAppetite(preferences.risk_appetite?.value || "conservative");
      setGrowthFocus(preferences.growth_focus?.value || "sustainable");
      setReinvestmentRatio(preferences.reinvestment_ratio?.value || "0.30");
      setDebtAppetite(preferences.debt_appetite?.value || "low");
      setPrimaryCurrency(preferences.primary_currency?.value || "INR");
      setIndustry(preferences.industry?.value || "wealthtech");
    }
  }, [preferences]);

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.updatePreference(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
    onError: (err: any) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const handleSavePreferences = async () => {
    try {
      await Promise.all([
        updateMutation.mutateAsync({ key: "risk_appetite", value: riskAppetite }),
        updateMutation.mutateAsync({ key: "growth_focus", value: growthFocus }),
        updateMutation.mutateAsync({ key: "reinvestment_ratio", value: reinvestmentRatio }),
        updateMutation.mutateAsync({ key: "debt_appetite", value: debtAppetite }),
        updateMutation.mutateAsync({ key: "primary_currency", value: primaryCurrency }),
        updateMutation.mutateAsync({ key: "industry", value: industry }),
      ]);
      toast.success("Strategic founder preferences updated successfully!");
    } catch (e) {
      // Errors handled in mutation callbacks
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse">Loading system settings...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Toaster position="top-right" richColors />
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure strategic growth preferences and founder constraints driving the AI agents.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Columns: Founder Preferences Form (2 Columns) */}
          <Card className="p-6 md:col-span-2 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-3">
              <Scale className="h-4 w-4 text-primary" /> Founder Core Constraints
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Risk Appetite */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  Risk Appetite <span title="Tolerance for risk/leverage"><HelpCircle className="h-3 w-3" /></span>
                </label>
                <select
                  value={riskAppetite}
                  onChange={(e) => setRiskAppetite(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm mt-1 focus:ring-1 focus:ring-primary cursor-pointer text-foreground font-semibold"
                >
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
                <p className="text-[10px] text-muted-foreground/70 mt-1 leading-normal">
                  {preferences?.risk_appetite?.description}
                </p>
              </div>

              {/* Growth Focus */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  Growth Strategy <span title="Burn rate profile focus"><HelpCircle className="h-3 w-3" /></span>
                </label>
                <select
                  value={growthFocus}
                  onChange={(e) => setGrowthFocus(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm mt-1 focus:ring-1 focus:ring-primary cursor-pointer text-foreground font-semibold"
                >
                  <option value="hyper-growth">Hyper-Growth</option>
                  <option value="balanced">Balanced</option>
                  <option value="sustainable">Sustainable</option>
                </select>
                <p className="text-[10px] text-muted-foreground/70 mt-1 leading-normal">
                  {preferences?.growth_focus?.description}
                </p>
              </div>

              {/* Reinvestment Ratio */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  Reinvestment Ratio <span title="Ratio of profit to reinvest"><HelpCircle className="h-3 w-3" /></span>
                </label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={reinvestmentRatio}
                    onChange={(e) => setReinvestmentRatio(e.target.value)}
                    className="pr-8 text-xs font-semibold"
                  />
                  <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-1 leading-normal">
                  {preferences?.reinvestment_ratio?.description}
                </p>
              </div>

              {/* Debt Appetite */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  Debt/Credit Appetite <span title="Leverage ratio tolerance"><HelpCircle className="h-3 w-3" /></span>
                </label>
                <select
                  value={debtAppetite}
                  onChange={(e) => setDebtAppetite(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm mt-1 focus:ring-1 focus:ring-primary cursor-pointer text-foreground font-semibold"
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
                <p className="text-[10px] text-muted-foreground/70 mt-1 leading-normal">
                  {preferences?.debt_appetite?.description}
                </p>
              </div>

              {/* Primary Currency */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  Reporting Currency
                </label>
                <select
                  value={primaryCurrency}
                  onChange={(e) => setPrimaryCurrency(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm mt-1 focus:ring-1 focus:ring-primary cursor-pointer text-foreground font-semibold"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
                <p className="text-[10px] text-muted-foreground/70 mt-1 leading-normal">
                  {preferences?.primary_currency?.description}
                </p>
              </div>

              {/* Industry */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  Target Industry/Sector
                </label>
                <Input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1 text-xs font-semibold"
                />
                <p className="text-[10px] text-muted-foreground/70 mt-1 leading-normal">
                  {preferences?.industry?.description}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button onClick={handleSavePreferences} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                <Save className="h-4 w-4 mr-1.5" /> Save Preferences
              </Button>
            </div>
          </Card>

          {/* Right Column: API & Model Settings Info */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-violet-500" /> LLM Orchestration
              </h3>
              <div className="space-y-3.5 text-xs">
                <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-1">
                  <span className="text-[10px] text-muted-foreground block font-mono">Provider backend</span>
                  <span className="font-bold text-foreground">Groq SDK API Service</span>
                </div>
                <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-1">
                  <span className="text-[10px] text-muted-foreground block font-mono">Selected AI Model</span>
                  <span className="font-bold text-foreground truncate block">llama-3.3-70b-versatile</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building className="h-4 w-4 text-primary" /> Corporate Settings
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Preferences stored here are fetched dynamically by the Research, Planning, compliance and decision agents to filter opportunities and calculate thresholds.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
