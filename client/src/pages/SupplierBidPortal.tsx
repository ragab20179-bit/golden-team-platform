/**
 * Supplier Bid Portal — Public page (no authentication required)
 * Accessible via: /rfq/:token
 *
 * Flow:
 *  1. Token is validated on load → shows RFQ details or error state
 *  2. Supplier fills in bid form (price, delivery, per-criterion values)
 *  3. On submit → one-time token is consumed → success confirmation
 *
 * Design: "Clean Professional" — white background, gold accent, Arabic-friendly
 */

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, AlertCircle, Clock, FileText, Package,
  DollarSign, Truck, Star, ChevronRight, Loader2, Building2,
  Mail, User, Calendar, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CriterionField {
  id: number;
  name: string;
  scoringType: string;
  stage: string;
  weight: number;
  higherIsBetter: number;
  thresholdValue: number | null;
  description: string | null;
}

interface RFQItem {
  id: number;
  description: string;
  quantity: number;
  unit: string | null;
  estimatedPrice: number | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SupplierBidPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  const [step, setStep] = useState<"loading" | "form" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [notes, setNotes] = useState("");
  const [criterionValues, setCriterionValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  // Validate token on mount
  const { data: tokenData, isLoading } = trpc.supplierBidPortal.validateToken.useQuery(
    { token },
    { enabled: token.length === 64, retry: false }
  );

  const submitBid = trpc.supplierBidPortal.submitPublicBid.useMutation();

  useEffect(() => {
    if (token.length !== 64) {
      setErrorMsg("Invalid bid submission link. Please check the link you received.");
      setStep("error");
      return;
    }
    if (!isLoading && tokenData) {
      if (!tokenData.valid) {
        setErrorMsg(tokenData.reason ?? "This link is no longer valid.");
        setStep("error");
      } else {
        setStep("form");
      }
    }
  }, [tokenData, isLoading, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenData?.valid) return;

    const price = parseInt(totalPrice.replace(/,/g, ""), 10);
    const days = parseInt(deliveryDays, 10);

    if (isNaN(price) || price < 0) {
      alert("Please enter a valid total price.");
      return;
    }
    if (isNaN(days) || days < 1) {
      alert("Please enter a valid delivery time in days.");
      return;
    }

    // Build criterion values map
    const critValues: Record<string, number> = {};
    for (const [key, val] of Object.entries(criterionValues)) {
      const num = parseFloat(val);
      if (!isNaN(num)) critValues[key] = num;
    }

    setSubmitting(true);
    try {
      const result = await submitBid.mutateAsync({
        token,
        totalPrice: price,
        deliveryDays: days,
        notes: notes.trim() || undefined,
        criterionValues: critValues,
      });
      setSubmissionId(result.submissionId);
      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setErrorMsg(msg);
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (step === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <p className="text-gray-500 text-sm">Verifying your bid invitation...</p>
        </div>
      </div>
    );
  }

  // ── Error / Expired ──────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-lg border-red-100">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Link Not Valid</h2>
            <p className="text-gray-500 text-sm leading-relaxed">{errorMsg}</p>
            <p className="text-gray-400 text-xs mt-4">
              If you believe this is an error, please contact the procurement team who sent you this invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-lg border-green-100">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Bid Submitted Successfully</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your bid has been received and recorded. The procurement team will review all submissions and notify you of the evaluation results.
            </p>
            {submissionId && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                <span className="text-gray-500">Reference ID: </span>
                <span className="font-mono font-semibold text-gray-800">BID-{String(submissionId).padStart(5, "0")}</span>
              </div>
            )}
            <p className="text-gray-400 text-xs">
              Please save your reference ID for future correspondence.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Bid Form ─────────────────────────────────────────────────────────────────
  if (!tokenData?.valid) return null;

  const { invite, rfq, items, criteria } = tokenData as {
    valid: true;
    invite: { id: number; supplierName: string; supplierEmail: string; supplierCompany: string | null; expiresAt: Date };
    rfq: { id: number; rfqNumber: string; title: string; description: string | null; technicalWeight: number; economicWeight: number; deadline: string | null };
    items: RFQItem[];
    criteria: CriterionField[];
  };

  const technicalCriteria = criteria.filter(c => c.stage === "technical");
  const economicCriteria = criteria.filter(c => c.stage === "economic");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">GT</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Golden Team Trading Services</h1>
            <p className="text-xs text-gray-500">Supplier Bid Submission Portal</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Supplier Info Banner */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-amber-600" />
                <span className="font-medium">{invite.supplierName}</span>
              </div>
              {invite.supplierCompany && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>{invite.supplierCompany}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-amber-600" />
                <span>{invite.supplierEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Expires: {new Date(invite.expiresAt).toLocaleDateString("en-SA", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RFQ Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  {rfq.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  RFQ #{rfq.rfqNumber}
                  {rfq.deadline && (
                    <span className="ml-3 inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Deadline: {new Date(rfq.deadline).toLocaleDateString("en-SA")}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  Technical {rfq.technicalWeight}%
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Economic {rfq.economicWeight}%
                </Badge>
              </div>
            </div>
          </CardHeader>
          {rfq.description && (
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 leading-relaxed">{rfq.description}</p>
            </CardContent>
          )}
        </Card>

        {/* Items Required */}
        {items.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                Items / Scope of Work
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Qty: {item.quantity} {item.unit ?? "units"}
                        {item.estimatedPrice && (
                          <span className="ml-3">Est. unit price: SAR {item.estimatedPrice.toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bid Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Core Bid Fields */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                Your Bid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="totalPrice" className="text-sm font-medium">
                    Total Bid Price (SAR) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">SAR</span>
                    <Input
                      id="totalPrice"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={totalPrice}
                      onChange={e => setTotalPrice(e.target.value.replace(/[^0-9,]/g, ""))}
                      className="pl-12"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deliveryDays" className="text-sm font-medium">
                    Delivery Time (Days) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="deliveryDays"
                      type="number"
                      min={1}
                      max={3650}
                      placeholder="e.g. 30"
                      value={deliveryDays}
                      onChange={e => setDeliveryDays(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Additional Notes / Technical Remarks
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Describe your approach, qualifications, warranty terms, or any conditions..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="resize-none"
                />
                <p className="text-xs text-gray-400 text-right">{notes.length}/2000</p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Criteria */}
          {technicalCriteria.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-500" />
                  Technical Evaluation Criteria
                </CardTitle>
                <CardDescription className="text-xs">
                  These criteria will be evaluated in the first stage. Minimum thresholds must be met to proceed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {technicalCriteria.map(crit => (
                  <div key={crit.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        {crit.name}
                        <Badge variant="secondary" className="ml-2 text-xs font-normal">
                          Weight: {crit.weight}%
                        </Badge>
                      </Label>
                      {crit.thresholdValue !== null && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Min: {crit.thresholdValue}
                        </span>
                      )}
                    </div>
                    {crit.description && (
                      <p className="text-xs text-gray-500">{crit.description}</p>
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={crit.scoringType === "threshold" ? "1 = Yes, 0 = No" : "Enter value"}
                      value={criterionValues[String(crit.id)] ?? ""}
                      onChange={e => setCriterionValues(prev => ({ ...prev, [String(crit.id)]: e.target.value }))}
                      className="max-w-xs"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Economic Criteria */}
          {economicCriteria.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Economic Evaluation Criteria
                </CardTitle>
                <CardDescription className="text-xs">
                  These criteria determine the final ranking among technically qualified suppliers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {economicCriteria.map(crit => (
                  <div key={crit.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        {crit.name}
                        <Badge variant="secondary" className="ml-2 text-xs font-normal">
                          Weight: {crit.weight}%
                        </Badge>
                        {!crit.higherIsBetter && (
                          <Badge variant="outline" className="ml-1 text-xs font-normal text-green-600 border-green-200">
                            Lower is better
                          </Badge>
                        )}
                      </Label>
                    </div>
                    {crit.description && (
                      <p className="text-xs text-gray-500">{crit.description}</p>
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter value"
                      value={criterionValues[String(crit.id)] ?? ""}
                      onChange={e => setCriterionValues(prev => ({ ...prev, [String(crit.id)]: e.target.value }))}
                      className="max-w-xs"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Disclaimer */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 leading-relaxed">
            <strong>Declaration:</strong> By submitting this bid, I confirm that all information provided is accurate and complete. I understand that this submission is binding and that Golden Team Trading Services reserves the right to accept or reject any bid without obligation to provide reasons.
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 text-base shadow-lg shadow-amber-500/20"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Bid...
              </>
            ) : (
              <>
                Submit Bid
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pb-8">
          Golden Team Trading Services — Procurement Portal · This link is for one-time use only
        </div>
      </div>
    </div>
  );
}
