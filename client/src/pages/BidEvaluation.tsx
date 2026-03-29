/**
 * BidEvaluation — Bid Evaluation Matrix Portal Page
 * Full Source-to-Award pipeline:
 *   RFQ Creation → Criteria Setup → Bid Submission → Scoring → Award
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText, Plus, Scale, Trophy, ChevronRight,
  ClipboardList, Users, BarChart3, RefreshCw, Gavel, Clock,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
interface RFQ {
  id: number;
  rfqNumber: string;
  title: string;
  description: string | null;
  status: string;
  deadline: Date | null;
  technicalWeight: number;
  economicWeight: number;
  createdAt: Date;
}

interface Criterion {
  id: number;
  rfqId: number;
  name: string;
  weight: number;
  scoringType: string;
  stage: string;
  higherIsBetter: number;
  description: string | null;
}

interface Submission {
  id: number;
  rfqId: number;
  supplierName: string;
  supplierEmail: string | null;
  totalPrice: number | null;
  deliveryDays: number | null;
  notes: string | null;
  status: string;
  submittedAt: Date;
}

interface EvalResult {
  rank: number;
  supplierName: string;
  totalScore: number;
  technicalScore: number;
  economicScore: number;
  criterionScores: Record<string, number>;
}

interface EvalSession {
  id: number;
  rfqId: number;
  rankedResults: string | null;
  recommendedSupplierId: number | null;
  aiJustification: string | null;
  status: string;
  evaluatedAt: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-white/10 text-white/50 border-white/20",
    open: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    evaluation: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    awarded: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return map[status] ?? "bg-white/10 text-white/50 border-white/20";
}

// ── Create RFQ Dialog ──────────────────────────────────────────────────────────
function CreateRFQDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techWeight, setTechWeight] = useState("40");
  const [ecoWeight, setEcoWeight] = useState("60");

  const createRFQ = trpc.bidEvaluation.createRFQ.useMutation({
    onSuccess: () => {
      toast.success("RFQ created successfully");
      setOpen(false);
      setTitle(""); setDescription("");
      onCreated();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!title.trim()) return toast.error("Title is required");
    const tw = parseInt(techWeight);
    const ew = parseInt(ecoWeight);
    if (tw + ew !== 100) return toast.error("Technical + Economic weights must sum to 100");
    createRFQ.mutate({ title, description, technicalWeight: tw, economicWeight: ew });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold gap-2">
          <Plus className="w-4 h-4" /> New RFQ
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Create New RFQ</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-white/70 text-sm">Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g., IT Infrastructure Supply 2025"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <div>
            <Label className="text-white/70 text-sm">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Scope, requirements, and special conditions..."
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-sm">Technical Weight (%)</Label>
              <Input type="number" value={techWeight} onChange={e => setTechWeight(e.target.value)}
                min={0} max={100} className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70 text-sm">Economic Weight (%)</Label>
              <Input type="number" value={ecoWeight} onChange={e => setEcoWeight(e.target.value)}
                min={0} max={100} className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <p className="text-xs text-white/40">Technical + Economic must equal 100%</p>
          <Button onClick={handleSubmit} disabled={createRFQ.isPending}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold">
            {createRFQ.isPending ? "Creating..." : "Create RFQ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Criterion Dialog ───────────────────────────────────────────────────────
function AddCriterionDialog({ rfqId, onAdded }: { rfqId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("20");
  const [scoringType, setScoringType] = useState("linear");
  const [stage, setStage] = useState("economic");
  const [higherIsBetter, setHigherIsBetter] = useState("1");

  const addCriterion = trpc.bidEvaluation.addCriterion.useMutation({
    onSuccess: () => {
      toast.success("Criterion added");
      setOpen(false); setName(""); setWeight("20");
      onAdded();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"
          className="border-white/20 text-white/70 hover:text-white bg-transparent gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Criterion
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add Evaluation Criterion</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-white/70 text-sm">Criterion Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g., Price, Delivery Time, ISO Certification"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-sm">Weight (%)</Label>
              <Input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                min={1} max={100} className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70 text-sm">Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="economic">Economic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-sm">Scoring Type</Label>
              <Select value={scoringType} onValueChange={setScoringType}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                  <SelectItem value="min_ratio">Min Ratio (price)</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="direct">Direct Score</SelectItem>
                  <SelectItem value="threshold">Pass/Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70 text-sm">Direction</Label>
              <Select value={higherIsBetter} onValueChange={setHigherIsBetter}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                  <SelectItem value="1">Higher is Better</SelectItem>
                  <SelectItem value="0">Lower is Better</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => addCriterion.mutate({
            rfqId, name, weight: parseInt(weight),
            scoringType: scoringType as "min_ratio" | "linear" | "direct" | "threshold",
            stage: stage as "technical" | "economic",
            higherIsBetter: parseInt(higherIsBetter),
          })} disabled={addCriterion.isPending}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold">
            {addCriterion.isPending ? "Adding..." : "Add Criterion"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Submit Bid Dialog ──────────────────────────────────────────────────────────
function SubmitBidDialog({ rfqId, criteria, onSubmitted }: {
  rfqId: number;
  criteria: Criterion[];
  onSubmitted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [scores, setScores] = useState<Record<number, string>>({});

  const submitBid = trpc.bidEvaluation.submitBid.useMutation({
    onSuccess: () => {
      toast.success("Bid submitted successfully");
      setOpen(false);
      setSupplierName(""); setSupplierEmail(""); setTotalPrice(""); setDeliveryDays(""); setScores({});
      onSubmitted();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!supplierName.trim()) return toast.error("Supplier name is required");
    submitBid.mutate({
      rfqId,
      supplierName,
      supplierEmail: supplierEmail || undefined,
      totalPrice: totalPrice ? parseInt(totalPrice) : undefined,
      deliveryDays: deliveryDays ? parseInt(deliveryDays) : undefined,
      criterionScores: Object.entries(scores).map(([id, val]) => ({
        criterionId: parseInt(id),
        rawValue: parseInt(val) || 0,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"
          className="border-white/20 text-white/70 hover:text-white bg-transparent gap-1">
          <Users className="w-3.5 h-3.5" /> Submit Bid
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Submit Supplier Bid</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-sm">Supplier Name *</Label>
              <Input value={supplierName} onChange={e => setSupplierName(e.target.value)}
                placeholder="Company name" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div>
              <Label className="text-white/70 text-sm">Email</Label>
              <Input value={supplierEmail} onChange={e => setSupplierEmail(e.target.value)}
                type="email" placeholder="contact@supplier.com"
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-sm">Total Price (SAR)</Label>
              <Input type="number" value={totalPrice} onChange={e => setTotalPrice(e.target.value)}
                placeholder="0" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div>
              <Label className="text-white/70 text-sm">Delivery Days</Label>
              <Input type="number" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)}
                placeholder="30" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
          </div>
          {criteria.length > 0 && (
            <div>
              <Label className="text-white/70 text-sm mb-2 block">Criterion Scores</Label>
              <div className="space-y-2">
                {criteria.map(c => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-xs text-white/60 flex-1">{c.name} ({c.weight}%)</span>
                    <Input type="number" value={scores[c.id] ?? ""}
                      onChange={e => setScores(prev => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder="0-100" className="w-24 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button onClick={handleSubmit} disabled={submitBid.isPending}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold">
            {submitBid.isPending ? "Submitting..." : "Submit Bid"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── RFQ Detail View ────────────────────────────────────────────────────────────
function RFQDetail({ rfq, onBack }: { rfq: RFQ; onBack: () => void }) {
  const utils = trpc.useUtils();

  const { data: criteria, refetch: refetchCriteria } = trpc.bidEvaluation.getCriteria.useQuery({ rfqId: rfq.id });
  const { data: submissions, refetch: refetchSubmissions } = trpc.bidEvaluation.getSubmissions.useQuery({ rfqId: rfq.id });
  const { data: evalSession } = trpc.bidEvaluation.getEvaluation.useQuery({ rfqId: rfq.id });

  const evaluate = trpc.bidEvaluation.evaluate.useMutation({
    onSuccess: () => {
      toast.success("Evaluation complete — results ready");
      utils.bidEvaluation.getEvaluation.invalidate({ rfqId: rfq.id });
    },
    onError: (err) => toast.error(`Evaluation failed: ${err.message}`),
  });

  const rankedResults: EvalResult[] = evalSession?.rankedResults
    ? (JSON.parse(evalSession.rankedResults) as EvalResult[])
    : [];

  const typedEvalSession = evalSession as EvalSession | null | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors text-sm">
          ← Back to RFQs
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">{rfq.title}</h2>
            <Badge className={`text-xs border ${statusBadge(rfq.status)}`}>{rfq.status}</Badge>
          </div>
          <p className="text-xs text-white/40 mt-0.5">{rfq.rfqNumber} · Tech {rfq.technicalWeight}% / Eco {rfq.economicWeight}%</p>
        </div>
        <div className="flex gap-2">
          <AddCriterionDialog rfqId={rfq.id} onAdded={refetchCriteria} />
          <SubmitBidDialog rfqId={rfq.id} criteria={criteria ?? []} onSubmitted={refetchSubmissions} />
          <Button size="sm" onClick={() => evaluate.mutate({ rfqId: rfq.id })}
            disabled={evaluate.isPending || (submissions?.length ?? 0) < 2}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1">
            <Scale className="w-3.5 h-3.5" />
            {evaluate.isPending ? "Evaluating..." : "Run Evaluation"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Criteria */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white/70">
              Evaluation Criteria ({criteria?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!criteria?.length ? (
              <p className="text-xs text-white/30 py-4 text-center">No criteria yet — add criteria to define scoring</p>
            ) : (
              <div className="space-y-2">
                {criteria.map((c: Criterion) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-sm text-white">{c.name}</div>
                      <div className="text-xs text-white/40">{c.scoringType} · {c.stage}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400">{c.weight}%</div>
                      <div className="text-xs text-white/30">{c.higherIsBetter ? "↑ higher" : "↓ lower"}</div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-white/10 text-xs text-white/40">
                  <span>Total weight</span>
                  <span className={(criteria as Criterion[]).reduce((s, c) => s + c.weight, 0) === 100 ? "text-emerald-400" : "text-red-400"}>
                    {(criteria as Criterion[]).reduce((s, c) => s + c.weight, 0)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submissions */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white/70">
              Bid Submissions ({submissions?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!submissions?.length ? (
              <p className="text-xs text-white/30 py-4 text-center">No bids yet — submit bids from suppliers</p>
            ) : (
              <div className="space-y-2">
                {(submissions as Submission[]).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-sm text-white font-medium">{s.supplierName}</div>
                      <div className="text-xs text-white/40">
                        {s.totalPrice ? `SAR ${s.totalPrice.toLocaleString()}` : "—"} ·{" "}
                        {s.deliveryDays ? `${s.deliveryDays} days` : "—"}
                      </div>
                    </div>
                    <Badge className="text-xs bg-blue-500/15 text-blue-400 border-blue-500/30">
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evaluation Results */}
      {rankedResults.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Evaluation Results
              </CardTitle>
              {typedEvalSession && (
                <span className="text-xs text-white/30">
                  {new Date(typedEvalSession.evaluatedAt).toLocaleString()}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rankedResults.map((r, i) => (
              <div key={i} className={`p-4 rounded-xl border ${i === 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? "bg-amber-500 text-[#05080F]" : "bg-white/10 text-white/60"}`}>
                      #{r.rank}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{r.supplierName}</div>
                      {i === 0 && (
                        <div className="text-xs text-amber-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Recommended for Award
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{r.totalScore.toFixed(1)}</div>
                    <div className="text-xs text-white/40">/ 100</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-white/40">Technical Score</div>
                    <div className="text-white font-medium">{r.technicalScore?.toFixed(1) ?? "—"}</div>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-white/40">Economic Score</div>
                    <div className="text-white font-medium">{r.economicScore?.toFixed(1) ?? "—"}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${i === 0 ? "bg-amber-500" : "bg-blue-500/60"}`}
                      style={{ width: `${r.totalScore}%` }} />
                  </div>
                </div>
              </div>
            ))}

            {typedEvalSession?.aiJustification && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="text-xs text-blue-400 font-medium mb-2 flex items-center gap-1">
                  <Gavel className="w-3 h-3" /> Award Recommendation
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{typedEvalSession.aiJustification}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function BidEvaluation() {
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const { data: rfqs, isLoading, refetch } = trpc.bidEvaluation.listRFQs.useQuery({});

  const stats = {
    total: rfqs?.length ?? 0,
    open: (rfqs as RFQ[] | undefined)?.filter(r => r.status === "open").length ?? 0,
    evaluation: (rfqs as RFQ[] | undefined)?.filter(r => r.status === "evaluation").length ?? 0,
    awarded: (rfqs as RFQ[] | undefined)?.filter(r => r.status === "awarded").length ?? 0,
  };

  if (selectedRFQ) {
    return (
      <PortalLayout title="Bid Evaluation">
        <RFQDetail rfq={selectedRFQ} onBack={() => setSelectedRFQ(null)} />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Bid Evaluation Matrix">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Bid Evaluation Matrix</h1>
              <p className="text-sm text-white/50">Source-to-Award procurement pipeline</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}
              className="border-white/20 text-white/60 hover:text-white bg-transparent">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <CreateRFQDialog onCreated={refetch} />
          </div>
        </div>

        {/* KPI bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total RFQs", value: stats.total, icon: ClipboardList, color: "text-white" },
            { label: "Open", value: stats.open, icon: Clock, color: "text-blue-400" },
            { label: "In Evaluation", value: stats.evaluation, icon: BarChart3, color: "text-amber-400" },
            { label: "Awarded", value: stats.awarded, icon: Trophy, color: "text-emerald-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-white/5 border-white/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-white/40">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* RFQ List */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white/70">All RFQs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : !(rfqs as RFQ[] | undefined)?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/30">
                <FileText className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">No RFQs yet</p>
                <p className="text-xs mt-1 opacity-60">Create your first RFQ to start the bid evaluation process</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(rfqs as RFQ[]).map((rfq) => (
                  <button key={rfq.id} onClick={() => setSelectedRFQ(rfq)}
                    className="w-full text-left flex items-center justify-between p-4 bg-white/5 hover:bg-white/[0.08] rounded-xl transition-colors border border-transparent hover:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Scale className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{rfq.title}</div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {rfq.rfqNumber} · Tech {rfq.technicalWeight}% / Eco {rfq.economicWeight}%
                          {rfq.deadline ? ` · Deadline ${new Date(rfq.deadline).toLocaleDateString()}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs border ${statusBadge(rfq.status)}`}>{rfq.status}</Badge>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
