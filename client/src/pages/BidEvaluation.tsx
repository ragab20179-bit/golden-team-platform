/**
 * Bid Evaluation Matrix — Portal Page
 * Design: "Prestige Dark" — matches the Golden Team portal aesthetic
 * Sections:
 *   1. RFQ List (default view)
 *   2. RFQ Creation Wizard (multi-step: details → items → criteria → review)
 *   3. RFQ Detail (bids + evaluation matrix + award recommendation)
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, ArrowLeft, FileText, Users, BarChart3, Trophy,
  ChevronRight, ChevronLeft, Trash2, CheckCircle2, Clock,
  AlertCircle, XCircle, Play, Award, Eye, RefreshCw
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Types ─────────────────────────────────────────────────────────────────────

type View = "list" | "create" | "detail";
type WizardStep = "details" | "items" | "criteria" | "review";

interface RfqItemDraft {
  id: string;
  itemName: string;
  itemNameAr: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: string;
}

interface CriterionDraft {
  id: string;
  name: string;
  nameAr: string;
  criterionType: "price" | "linear" | "threshold" | "direct" | "formula";
  weight: number;
  higherIsBetter: boolean;
  description: string;
}

interface BidDraft {
  vendorName: string;
  vendorEmail: string;
  totalBidAmount: string;
  deliveryDays: string;
  warrantyMonths: string;
  notes: string;
  criterionValues: Record<string, string>;
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft:      { label: "Draft",      labelAr: "مسودة",       color: "bg-zinc-700 text-zinc-300",      icon: FileText },
  published:  { label: "Published",  labelAr: "منشور",       color: "bg-blue-900/50 text-blue-300",   icon: Eye },
  evaluation: { label: "Evaluation", labelAr: "تقييم",       color: "bg-amber-900/50 text-amber-300", icon: BarChart3 },
  awarded:    { label: "Awarded",    labelAr: "مُرسى",       color: "bg-emerald-900/50 text-emerald-300", icon: Trophy },
  closed:     { label: "Closed",     labelAr: "مغلق",        color: "bg-zinc-800 text-zinc-500",      icon: XCircle },
  cancelled:  { label: "Cancelled",  labelAr: "ملغي",        color: "bg-red-900/50 text-red-400",     icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function formatSAR(amount: number | null | undefined) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);
}

// ── Wizard: Step 1 — RFQ Details ──────────────────────────────────────────────

function StepDetails({ data, onChange }: {
  data: { title: string; titleAr: string; description: string; category: string; budget: string; currency: string; submissionDeadline: string; evaluationDeadline: string };
  onChange: (d: Partial<typeof data>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">RFQ Title (English) *</Label>
          <Input value={data.title} onChange={e => onChange({ title: e.target.value })}
            placeholder="e.g. IT Infrastructure Upgrade 2026"
            className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">عنوان طلب العروض (عربي)</Label>
          <Input value={data.titleAr} onChange={e => onChange({ titleAr: e.target.value })}
            placeholder="مثال: تطوير البنية التحتية لتقنية المعلومات"
            className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 text-right" dir="rtl" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-300 text-sm">Description</Label>
        <Textarea value={data.description} onChange={e => onChange({ description: e.target.value })}
          placeholder="Describe the scope and requirements..."
          className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Category</Label>
          <Input value={data.category} onChange={e => onChange({ category: e.target.value })}
            placeholder="IT / Construction / Services"
            className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Budget</Label>
          <Input type="number" value={data.budget} onChange={e => onChange({ budget: e.target.value })}
            placeholder="0"
            className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Currency</Label>
          <Select value={data.currency} onValueChange={v => onChange({ currency: v })}>
            <SelectTrigger className="bg-zinc-800/60 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {["SAR", "USD", "EUR", "AED", "KWD"].map(c => (
                <SelectItem key={c} value={c} className="text-white hover:bg-zinc-800">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Submission Deadline</Label>
          <Input type="date" value={data.submissionDeadline} onChange={e => onChange({ submissionDeadline: e.target.value })}
            className="bg-zinc-800/60 border-zinc-700 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Evaluation Deadline</Label>
          <Input type="date" value={data.evaluationDeadline} onChange={e => onChange({ evaluationDeadline: e.target.value })}
            className="bg-zinc-800/60 border-zinc-700 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Wizard: Step 2 — RFQ Items ────────────────────────────────────────────────

function StepItems({ items, onChange }: { items: RfqItemDraft[]; onChange: (items: RfqItemDraft[]) => void }) {
  function addItem() {
    onChange([...items, { id: crypto.randomUUID(), itemName: "", itemNameAr: "", quantity: 1, unit: "unit", estimatedUnitPrice: "" }]);
  }
  function updateItem(id: string, patch: Partial<RfqItemDraft>) {
    onChange(items.map(i => i.id === id ? { ...i, ...patch } : i));
  }
  function removeItem(id: string) {
    onChange(items.filter(i => i.id !== id));
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={item.id} className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-amber-400 text-sm font-medium">Item {idx + 1}</span>
            <button onClick={() => removeItem(item.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input value={item.itemName} onChange={e => updateItem(item.id, { itemName: e.target.value })}
              placeholder="Item name (English) *"
              className="bg-zinc-900/60 border-zinc-700 text-white placeholder:text-zinc-500 text-sm" />
            <Input value={item.itemNameAr} onChange={e => updateItem(item.id, { itemNameAr: e.target.value })}
              placeholder="اسم الصنف (عربي)"
              className="bg-zinc-900/60 border-zinc-700 text-white placeholder:text-zinc-500 text-sm text-right" dir="rtl" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Quantity</Label>
              <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                className="bg-zinc-900/60 border-zinc-700 text-white text-sm" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Unit</Label>
              <Input value={item.unit} onChange={e => updateItem(item.id, { unit: e.target.value })}
                placeholder="unit / kg / m²"
                className="bg-zinc-900/60 border-zinc-700 text-white placeholder:text-zinc-500 text-sm" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Est. Unit Price (SAR)</Label>
              <Input type="number" value={item.estimatedUnitPrice} onChange={e => updateItem(item.id, { estimatedUnitPrice: e.target.value })}
                placeholder="0"
                className="bg-zinc-900/60 border-zinc-700 text-white placeholder:text-zinc-500 text-sm" />
            </div>
          </div>
        </div>
      ))}
      <Button onClick={addItem} variant="outline" className="w-full border-dashed border-zinc-600 text-zinc-400 hover:text-amber-400 hover:border-amber-500/50 bg-transparent">
        <Plus className="w-4 h-4 mr-2" /> Add Item
      </Button>
    </div>
  );
}

// ── Wizard: Step 3 — Evaluation Criteria ─────────────────────────────────────

const CRITERION_TYPES = [
  { value: "price", label: "Price (min ratio)", desc: "Lower price = higher score" },
  { value: "linear", label: "Linear (range)", desc: "Score based on min/max range" },
  { value: "direct", label: "Direct (committee)", desc: "Evaluator enters 0-100 score" },
  { value: "threshold", label: "Threshold (bands)", desc: "Score based on value bands" },
  { value: "formula", label: "Formula (custom)", desc: "Custom math expression" },
];

function StepCriteria({ criteria, onChange }: { criteria: CriterionDraft[]; onChange: (c: CriterionDraft[]) => void }) {
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);

  function addCriterion() {
    onChange([...criteria, {
      id: crypto.randomUUID(),
      name: "", nameAr: "",
      criterionType: "linear",
      weight: 20,
      higherIsBetter: true,
      description: "",
    }]);
  }
  function update(id: string, patch: Partial<CriterionDraft>) {
    onChange(criteria.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function remove(id: string) {
    onChange(criteria.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between text-sm px-1 ${totalWeight === 100 ? "text-emerald-400" : totalWeight > 100 ? "text-red-400" : "text-amber-400"}`}>
        <span>Total Weight: <strong>{totalWeight}%</strong></span>
        {totalWeight !== 100 && <span className="text-xs">Must equal 100%</span>}
        {totalWeight === 100 && <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Balanced</span>}
      </div>

      {criteria.map((c, idx) => (
        <div key={c.id} className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-amber-400 text-sm font-medium">Criterion {idx + 1}</span>
            <button onClick={() => remove(c.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input value={c.name} onChange={e => update(c.id, { name: e.target.value })}
              placeholder="Criterion name (English) *"
              className="bg-zinc-900/60 border-zinc-700 text-white placeholder:text-zinc-500 text-sm" />
            <Input value={c.nameAr} onChange={e => update(c.id, { nameAr: e.target.value })}
              placeholder="اسم المعيار (عربي)"
              className="bg-zinc-900/60 border-zinc-700 text-white placeholder:text-zinc-500 text-sm text-right" dir="rtl" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <Label className="text-zinc-400 text-xs mb-1 block">Type</Label>
              <Select value={c.criterionType} onValueChange={v => update(c.id, { criterionType: v as CriterionDraft["criterionType"] })}>
                <SelectTrigger className="bg-zinc-900/60 border-zinc-700 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {CRITERION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-white hover:bg-zinc-800">
                      <div>
                        <div className="text-sm">{t.label}</div>
                        <div className="text-xs text-zinc-500">{t.desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Weight %</Label>
              <Input type="number" min={1} max={100} value={c.weight} onChange={e => update(c.id, { weight: parseInt(e.target.value) || 0 })}
                className="bg-zinc-900/60 border-zinc-700 text-white text-sm" />
            </div>
            {c.criterionType !== "price" && (
              <div>
                <Label className="text-zinc-400 text-xs mb-1 block">Direction</Label>
                <Select value={c.higherIsBetter ? "higher" : "lower"} onValueChange={v => update(c.id, { higherIsBetter: v === "higher" })}>
                  <SelectTrigger className="bg-zinc-900/60 border-zinc-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="higher" className="text-white hover:bg-zinc-800">Higher = Better</SelectItem>
                    <SelectItem value="lower" className="text-white hover:bg-zinc-800">Lower = Better</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {c.criterionType === "formula" && (
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Formula (use: value, min, max, mean)</Label>
              <Input value={c.description} onChange={e => update(c.id, { description: e.target.value })}
                placeholder="e.g. 100 - abs(value - mean) / mean * 100"
                className="bg-zinc-900/60 border-zinc-700 text-white placeholder:text-zinc-500 text-sm font-mono" />
            </div>
          )}
        </div>
      ))}
      <Button onClick={addCriterion} variant="outline" className="w-full border-dashed border-zinc-600 text-zinc-400 hover:text-amber-400 hover:border-amber-500/50 bg-transparent">
        <Plus className="w-4 h-4 mr-2" /> Add Criterion
      </Button>
    </div>
  );
}

// ── Wizard: Step 4 — Review & Submit ─────────────────────────────────────────

function StepReview({ details, items, criteria }: { details: any; items: RfqItemDraft[]; criteria: CriterionDraft[] }) {
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  return (
    <div className="space-y-5">
      <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/50">
        <h4 className="text-amber-400 text-sm font-semibold mb-3">RFQ Details</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-zinc-500">Title</span><span className="text-white">{details.title}</span>
          <span className="text-zinc-500">Category</span><span className="text-white">{details.category || "—"}</span>
          <span className="text-zinc-500">Budget</span><span className="text-white">{details.budget ? `${details.budget} ${details.currency}` : "—"}</span>
          <span className="text-zinc-500">Deadline</span><span className="text-white">{details.submissionDeadline || "—"}</span>
        </div>
      </div>
      <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/50">
        <h4 className="text-amber-400 text-sm font-semibold mb-3">Items ({items.length})</h4>
        {items.map((item, i) => (
          <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-700/30 last:border-0">
            <span className="text-white">{item.itemName}</span>
            <span className="text-zinc-400">{item.quantity} {item.unit}</span>
          </div>
        ))}
      </div>
      <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/50">
        <h4 className="text-amber-400 text-sm font-semibold mb-3">Criteria ({criteria.length}) — Total: {totalWeight}%</h4>
        {criteria.map((c, i) => (
          <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-700/30 last:border-0">
            <span className="text-white">{c.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-xs">{c.criterionType}</span>
              <span className="text-amber-400 font-medium">{c.weight}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bid Submission Form ───────────────────────────────────────────────────────

function BidSubmitForm({ rfqId, criteria, onClose }: { rfqId: number; criteria: any[]; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<BidDraft>({
    vendorName: "", vendorEmail: "", totalBidAmount: "",
    deliveryDays: "", warrantyMonths: "", notes: "",
    criterionValues: {},
  });

  const submitBid = trpc.bidEvaluation.bid.submit.useMutation({
    onSuccess: () => {
      toast.success("Bid submitted successfully");
      utils.bidEvaluation.rfq.get.invalidate({ rfqId });
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit() {
    if (!draft.vendorName.trim()) { toast.error("Vendor name is required"); return; }
    submitBid.mutate({
      rfqId,
      vendorName: draft.vendorName,
      vendorEmail: draft.vendorEmail || undefined,
      totalBidAmount: draft.totalBidAmount ? parseFloat(draft.totalBidAmount) : undefined,
      deliveryDays: draft.deliveryDays ? parseInt(draft.deliveryDays) : undefined,
      warrantyMonths: draft.warrantyMonths ? parseInt(draft.warrantyMonths) : undefined,
      notes: draft.notes || undefined,
      criterionValues: Object.fromEntries(
        Object.entries(draft.criterionValues).map(([k, v]) => [k, parseFloat(v) || 0])
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-zinc-300 text-sm mb-1 block">Vendor Name *</Label>
          <Input value={draft.vendorName} onChange={e => setDraft(d => ({ ...d, vendorName: e.target.value }))}
            placeholder="Company name"
            className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500" />
        </div>
        <div>
          <Label className="text-zinc-300 text-sm mb-1 block">Email</Label>
          <Input type="email" value={draft.vendorEmail} onChange={e => setDraft(d => ({ ...d, vendorEmail: e.target.value }))}
            placeholder="vendor@company.com"
            className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500" />
        </div>
        <div>
          <Label className="text-zinc-300 text-sm mb-1 block">Total Bid Amount (SAR)</Label>
          <Input type="number" value={draft.totalBidAmount} onChange={e => setDraft(d => ({ ...d, totalBidAmount: e.target.value }))}
            placeholder="0"
            className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500" />
        </div>
        <div>
          <Label className="text-zinc-300 text-sm mb-1 block">Delivery Days</Label>
          <Input type="number" value={draft.deliveryDays} onChange={e => setDraft(d => ({ ...d, deliveryDays: e.target.value }))}
            placeholder="30"
            className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500" />
        </div>
      </div>

      {criteria.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-amber-400 text-sm font-semibold">Criterion Values</h4>
          {criteria.map(c => (
            <div key={c.id} className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-zinc-300 text-xs mb-1 block">{c.name} ({c.criterionType}, {c.weight}%)</Label>
                <Input type="number"
                  value={draft.criterionValues[c.id] ?? ""}
                  onChange={e => setDraft(d => ({ ...d, criterionValues: { ...d.criterionValues, [c.id]: e.target.value } }))}
                  placeholder={c.criterionType === "price" ? "Bid amount" : c.criterionType === "direct" ? "Score 0-100" : "Value"}
                  className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 text-sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <Label className="text-zinc-300 text-sm mb-1 block">Notes</Label>
        <Textarea value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
          placeholder="Additional notes or conditions..."
          className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[60px]" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={submitBid.isPending}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold">
          {submitBid.isPending ? "Submitting..." : "Submit Bid"}
        </Button>
        <Button onClick={onClose} variant="outline" className="border-zinc-700 text-zinc-300 bg-transparent hover:bg-zinc-800">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Evaluation Matrix Table ───────────────────────────────────────────────────

function EvaluationMatrix({ rfqId, criteria, bids }: { rfqId: number; criteria: any[]; bids: any[] }) {
  const utils = trpc.useUtils();
  const { data: evalSession } = trpc.bidEvaluation.evaluation.getResults.useQuery({ rfqId });

  const runEvaluation = trpc.bidEvaluation.evaluation.run.useMutation({
    onSuccess: (data) => {
      toast.success(`Evaluation complete — Winner: ${data.summary.winner}`);
      utils.bidEvaluation.evaluation.getResults.invalidate({ rfqId });
      utils.bidEvaluation.rfq.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const awardMutation = trpc.bidEvaluation.evaluation.award.useMutation({
    onSuccess: () => {
      toast.success("Award decision recorded");
      utils.bidEvaluation.rfq.list.invalidate();
      utils.bidEvaluation.rfq.get.invalidate({ rfqId });
    },
    onError: (e) => toast.error(e.message),
  });

  const ranked = evalSession?.rankedResults as Array<{
    vendor: string; ranking: number; final_score: number;
    criterion_scores: Record<string, number | null>;
    eliminated_at_stage?: string | null;
  }> | null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Evaluation Matrix</h3>
        <Button
          onClick={() => runEvaluation.mutate({ rfqId })}
          disabled={runEvaluation.isPending || bids.length === 0}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm"
        >
          {runEvaluation.isPending ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running...</>
          ) : (
            <><Play className="w-4 h-4 mr-2" /> Run Evaluation</>
          )}
        </Button>
      </div>

      {!ranked && (
        <div className="text-center py-12 text-zinc-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No evaluation run yet. Add bids and click "Run Evaluation".</p>
        </div>
      )}

      {ranked && (
        <>
          {/* Ranked Results Table */}
          <div className="overflow-x-auto rounded-lg border border-zinc-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-800/60 border-b border-zinc-700">
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium w-8">#</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Vendor</th>
                  {criteria.map(c => (
                    <th key={c.id} className="text-center px-3 py-3 text-zinc-400 font-medium whitespace-nowrap">
                      <div>{c.name}</div>
                      <div className="text-xs text-zinc-600">{c.weight}%</div>
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 text-amber-400 font-semibold">Final Score</th>
                  <th className="text-center px-4 py-3 text-zinc-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((row, idx) => {
                  const isWinner = row.ranking === 1 && !row.eliminated_at_stage;
                  return (
                    <tr key={row.vendor} className={`border-b border-zinc-700/30 transition-colors ${isWinner ? "bg-amber-500/5" : "hover:bg-zinc-800/30"}`}>
                      <td className="px-4 py-3">
                        {isWinner ? (
                          <Trophy className="w-4 h-4 text-amber-400" />
                        ) : (
                          <span className="text-zinc-500">{row.ranking}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{row.vendor}</div>
                        {row.eliminated_at_stage && (
                          <div className="text-xs text-red-400">Eliminated at {row.eliminated_at_stage}</div>
                        )}
                      </td>
                      {criteria.map(c => {
                        const colKey = `crit_${c.id}`;
                        const score = row.criterion_scores?.[colKey];
                        return (
                          <td key={c.id} className="px-3 py-3 text-center">
                            {score != null ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-semibold ${score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"}`}>
                                  {score.toFixed(1)}
                                </span>
                                <div className="w-12 h-1 rounded-full bg-zinc-700">
                                  <div className={`h-1 rounded-full ${score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                                    style={{ width: `${Math.min(score, 100)}%` }} />
                                </div>
                              </div>
                            ) : <span className="text-zinc-600">—</span>}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-lg font-bold ${isWinner ? "text-amber-400" : "text-white"}`}>
                          {row.final_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isWinner && (
                          <Button
                            size="sm"
                            onClick={() => awardMutation.mutate({
                              rfqId,
                              awardedVendor: row.vendor,
                              awardJustification: `Highest evaluation score: ${row.final_score.toFixed(1)}/100`,
                            })}
                            disabled={awardMutation.isPending}
                            className="bg-amber-500 hover:bg-amber-400 text-zinc-900 text-xs"
                          >
                            <Award className="w-3 h-3 mr-1" /> Award
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Winner Card */}
          {ranked[0] && !ranked[0].eliminated_at_stage && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/20 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-1">Recommended Award</div>
                  <div className="text-white text-xl font-bold">{ranked[0].vendor}</div>
                  <div className="text-zinc-400 text-sm mt-1">
                    Final Score: <span className="text-amber-400 font-semibold">{ranked[0].final_score.toFixed(1)}/100</span>
                    {ranked[1] && (
                      <span className="ml-3 text-zinc-500">
                        (+{(ranked[0].final_score - ranked[1].final_score).toFixed(1)} over #{2})
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-500 text-xs mt-2">
                    Based on {criteria.length} weighted criteria. Evaluation run on {new Date().toLocaleDateString()}.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── RFQ Detail View ───────────────────────────────────────────────────────────

function RFQDetail({ rfqId, onBack }: { rfqId: number; onBack: () => void }) {
  const [showBidForm, setShowBidForm] = useState(false);
  const { data, isLoading } = trpc.bidEvaluation.rfq.get.useQuery({ rfqId });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-zinc-500">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading RFQ...
    </div>
  );
  if (!data) return <div className="text-zinc-500 py-10 text-center">RFQ not found.</div>;

  const { rfq, items, criteria, bids } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to RFQ List
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-white text-xl font-bold">{rfq.title}</h2>
            <StatusBadge status={rfq.status} />
          </div>
          <div className="text-zinc-500 text-sm mt-1">{rfq.rfqNumber} · {rfq.category ?? "General"}</div>
        </div>
        <div className="text-right">
          <div className="text-zinc-500 text-xs">Budget</div>
          <div className="text-amber-400 font-semibold">{formatSAR(rfq.budget)}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Items", value: items.length, icon: FileText, color: "text-blue-400" },
          { label: "Criteria", value: criteria.length, icon: BarChart3, color: "text-violet-400" },
          { label: "Bids", value: bids.length, icon: Users, color: "text-emerald-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/50 flex items-center gap-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <div className="text-white text-xl font-bold">{stat.value}</div>
              <div className="text-zinc-500 text-xs">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bids section */}
      <div className="bg-zinc-800/20 rounded-xl border border-zinc-700/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Vendor Bids</h3>
          {rfq.status !== "awarded" && rfq.status !== "closed" && rfq.status !== "cancelled" && (
            <Button onClick={() => setShowBidForm(!showBidForm)} size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm">
              <Plus className="w-4 h-4 mr-1" /> Add Bid
            </Button>
          )}
        </div>

        {showBidForm && (
          <div className="mb-5 bg-zinc-900/60 rounded-lg p-4 border border-zinc-700">
            <h4 className="text-amber-400 text-sm font-semibold mb-3">New Bid Submission</h4>
            <BidSubmitForm rfqId={rfqId} criteria={criteria} onClose={() => setShowBidForm(false)} />
          </div>
        )}

        {bids.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No bids submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bids.map(bid => (
              <div key={bid.id} className="flex items-center justify-between bg-zinc-800/40 rounded-lg px-4 py-3 border border-zinc-700/30">
                <div>
                  <div className="text-white font-medium text-sm">{bid.vendorName}</div>
                  <div className="text-zinc-500 text-xs">{bid.vendorEmail ?? "No email"} · {bid.deliveryDays ? `${bid.deliveryDays} days` : "—"}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-amber-400 font-semibold text-sm">{formatSAR(bid.totalBidAmount)}</div>
                    <div className="text-zinc-500 text-xs">{bid.currency}</div>
                  </div>
                  <StatusBadge status={bid.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evaluation Matrix */}
      <div className="bg-zinc-800/20 rounded-xl border border-zinc-700/50 p-5">
        <EvaluationMatrix rfqId={rfqId} criteria={criteria} bids={bids} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BidEvaluation() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("list");
  const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>("details");

  // Wizard state
  const [details, setDetails] = useState({
    title: "", titleAr: "", description: "", descriptionAr: "",
    category: "", budget: "", currency: "SAR",
    submissionDeadline: "", evaluationDeadline: "",
  });
  const [items, setItems] = useState<RfqItemDraft[]>([
    { id: crypto.randomUUID(), itemName: "", itemNameAr: "", quantity: 1, unit: "unit", estimatedUnitPrice: "" }
  ]);
  const [criteria, setCriteria] = useState<CriterionDraft[]>([
    { id: crypto.randomUUID(), name: "Price", nameAr: "السعر", criterionType: "price", weight: 50, higherIsBetter: false, description: "" },
    { id: crypto.randomUUID(), name: "Experience", nameAr: "الخبرة", criterionType: "linear", weight: 30, higherIsBetter: true, description: "" },
    { id: crypto.randomUUID(), name: "Delivery Time", nameAr: "مدة التسليم", criterionType: "linear", weight: 20, higherIsBetter: false, description: "" },
  ]);

  const utils = trpc.useUtils();
  const { data: rfqList = [], isLoading: listLoading } = trpc.bidEvaluation.rfq.list.useQuery();

  const createRfq = trpc.bidEvaluation.rfq.create.useMutation({
    onSuccess: (data) => {
      toast.success(`RFQ ${data.rfqNumber} created successfully`);
      utils.bidEvaluation.rfq.list.invalidate();
      setView("detail");
      setSelectedRfqId(data.rfqId);
    },
    onError: (e) => toast.error(e.message),
  });

  const WIZARD_STEPS: WizardStep[] = ["details", "items", "criteria", "review"];
  const stepIdx = WIZARD_STEPS.indexOf(wizardStep);

  function handleCreateSubmit() {
    const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
    if (totalWeight !== 100) { toast.error(`Criteria weights must sum to 100% (currently ${totalWeight}%)`); return; }
    if (!details.title.trim()) { toast.error("RFQ title is required"); return; }
    if (items.some(i => !i.itemName.trim())) { toast.error("All items must have a name"); return; }
    if (criteria.some(c => !c.name.trim())) { toast.error("All criteria must have a name"); return; }

    createRfq.mutate({
      ...details,
      budget: details.budget ? parseFloat(details.budget) : undefined,
      items: items.map(i => ({
        itemName: i.itemName,
        itemNameAr: i.itemNameAr || undefined,
        quantity: i.quantity,
        unit: i.unit,
        estimatedUnitPrice: i.estimatedUnitPrice ? parseFloat(i.estimatedUnitPrice) : undefined,
      })),
      criteria: criteria.map(c => ({
        name: c.name,
        nameAr: c.nameAr || undefined,
        criterionType: c.criterionType,
        weight: c.weight,
        higherIsBetter: c.higherIsBetter,
        formula: c.criterionType === "formula" ? c.description : undefined,
        sortOrder: 0,
      })),
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PortalLayout title="Bid Evaluation Matrix" subtitle="RFQ management and vendor scoring">
      <div className="p-6 max-w-6xl mx-auto">

        {/* ── RFQ List ── */}
        {view === "list" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white text-2xl font-bold">Bid Evaluation Matrix</h1>
                <p className="text-zinc-500 text-sm mt-1">RFQ management, vendor bid collection, and AI-powered evaluation scoring</p>
              </div>
              <Button onClick={() => { setView("create"); setWizardStep("details"); }}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold">
                <Plus className="w-4 h-4 mr-2" /> New RFQ
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total RFQs", value: rfqList.length, color: "text-white" },
                { label: "Published", value: rfqList.filter(r => r.status === "published").length, color: "text-blue-400" },
                { label: "In Evaluation", value: rfqList.filter(r => r.status === "evaluation").length, color: "text-amber-400" },
                { label: "Awarded", value: rfqList.filter(r => r.status === "awarded").length, color: "text-emerald-400" },
              ].map(s => (
                <div key={s.label} className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/50">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-zinc-500 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* RFQ Table */}
            {listLoading ? (
              <div className="text-center py-16 text-zinc-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading RFQs...
              </div>
            ) : rfqList.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-700 rounded-xl">
                <FileText className="w-14 h-14 mx-auto mb-3 text-zinc-700" />
                <p className="text-zinc-400 font-medium">No RFQs yet</p>
                <p className="text-zinc-600 text-sm mt-1">Create your first RFQ to start collecting vendor bids</p>
                <Button onClick={() => setView("create")} className="mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-900">
                  <Plus className="w-4 h-4 mr-2" /> Create RFQ
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rfqList.map(rfq => (
                  <div key={rfq.id}
                    onClick={() => { setSelectedRfqId(rfq.id); setView("detail"); }}
                    className="bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600 rounded-xl p-5 cursor-pointer transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-amber-400/60 text-xs font-mono">{rfq.rfqNumber}</span>
                          <StatusBadge status={rfq.status} />
                        </div>
                        <h3 className="text-white font-semibold group-hover:text-amber-400 transition-colors truncate">{rfq.title}</h3>
                        <div className="text-zinc-500 text-sm mt-1 flex items-center gap-4">
                          <span>{rfq.category ?? "General"}</span>
                          {rfq.budget && <span>{formatSAR(rfq.budget)}</span>}
                          {rfq.submissionDeadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rfq.submissionDeadline}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        {rfq.awardedVendor && (
                          <div className="text-right">
                            <div className="text-xs text-zinc-500">Awarded to</div>
                            <div className="text-emerald-400 text-sm font-medium">{rfq.awardedVendor}</div>
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Create Wizard ── */}
        {view === "create" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setView("list")} className="text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-white text-xl font-bold">Create New RFQ</h1>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {WIZARD_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                    ${i < stepIdx ? "bg-emerald-500 text-white" : i === stepIdx ? "bg-amber-500 text-zinc-900" : "bg-zinc-700 text-zinc-400"}`}>
                    {i < stepIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs capitalize hidden sm:block ${i === stepIdx ? "text-amber-400" : "text-zinc-500"}`}>{step}</span>
                  {i < WIZARD_STEPS.length - 1 && <div className={`w-8 h-px ${i < stepIdx ? "bg-emerald-500" : "bg-zinc-700"}`} />}
                </div>
              ))}
            </div>

            {/* Step content */}
            <Card className="bg-zinc-800/30 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-base capitalize">
                  Step {stepIdx + 1}: {wizardStep === "details" ? "RFQ Details" : wizardStep === "items" ? "Line Items" : wizardStep === "criteria" ? "Evaluation Criteria" : "Review & Submit"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wizardStep === "details" && <StepDetails data={details} onChange={patch => setDetails(d => ({ ...d, ...patch }))} />}
                {wizardStep === "items" && <StepItems items={items} onChange={setItems} />}
                {wizardStep === "criteria" && <StepCriteria criteria={criteria} onChange={setCriteria} />}
                {wizardStep === "review" && <StepReview details={details} items={items} criteria={criteria} />}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                onClick={() => setWizardStep(WIZARD_STEPS[stepIdx - 1])}
                disabled={stepIdx === 0}
                variant="outline"
                className="border-zinc-700 text-zinc-300 bg-transparent hover:bg-zinc-800"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              {stepIdx < WIZARD_STEPS.length - 1 ? (
                <Button onClick={() => setWizardStep(WIZARD_STEPS[stepIdx + 1])}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleCreateSubmit} disabled={createRfq.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                  {createRfq.isPending ? "Creating..." : "Create RFQ"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── RFQ Detail ── */}
        {view === "detail" && selectedRfqId != null && (
          <RFQDetail rfqId={selectedRfqId} onBack={() => setView("list")} />
        )}
      </div>
    </PortalLayout>
  );
}
