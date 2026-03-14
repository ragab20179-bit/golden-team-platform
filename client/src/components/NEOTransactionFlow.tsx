/**
 * NEO Transaction Flow Component
 * Design: "Neural Depth" — animated 5-stage progress with glass morphism cards
 * Shows the live transaction state with stage indicators, field forms, and AMG check
 */
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, Clock, ShieldCheck, Zap, Database, AlertTriangle, XCircle } from "lucide-react";
import { TransactionState, TransactionStage, TRANSACTION_DEFINITIONS } from "@/lib/neoTransactionEngine";

const STAGES: Array<{ id: TransactionStage; label: string; icon: React.ReactNode; color: string }> = [
  { id: "INTENT",    label: "Intent",    icon: <Zap className="w-3 h-3" />,        color: "text-violet-400 border-violet-500/40 bg-violet-500/10" },
  { id: "DATA",      label: "Data",      icon: <Circle className="w-3 h-3" />,     color: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
  { id: "CONFIRM",   label: "Confirm",   icon: <Clock className="w-3 h-3" />,      color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  { id: "AMG_CHECK", label: "AMG",       icon: <ShieldCheck className="w-3 h-3" />, color: "text-red-400 border-red-500/40 bg-red-500/10" },
  { id: "EXECUTE",   label: "Execute",   icon: <Database className="w-3 h-3" />,   color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
];

const STAGE_ORDER: TransactionStage[] = ["INTENT", "DATA", "CONFIRM", "AMG_CHECK", "EXECUTE", "DONE"];

function getStageIndex(stage: TransactionStage): number {
  return STAGE_ORDER.indexOf(stage);
}

interface NEOTransactionFlowProps {
  transaction: TransactionState;
}

export default function NEOTransactionFlow({ transaction }: NEOTransactionFlowProps) {
  const def = TRANSACTION_DEFINITIONS[transaction.type];
  const currentIdx = getStageIndex(transaction.stage);
  const isDone = transaction.stage === "DONE";
  const isRejected = transaction.stage === "REJECTED";

  // Determine which stages to show (skip AMG if not required)
  const visibleStages = transaction.amgRequired
    ? STAGES
    : STAGES.filter((s) => s.id !== "AMG_CHECK");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2 rounded-xl border border-white/8 overflow-hidden"
      style={{ background: "rgba(9,14,26,0.8)", backdropFilter: "blur(12px)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5"
        style={{ background: "rgba(59,130,246,0.05)" }}>
        <span className="text-xl">{def.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {def.title}
          </div>
          <div className="text-[11px] text-white/40">via {def.integration}</div>
        </div>
        <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
          isDone ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
          isRejected ? "text-red-400 border-red-500/30 bg-red-500/10" :
          "text-blue-400 border-blue-500/30 bg-blue-500/10 animate-pulse"
        }`}>
          {isDone ? "COMPLETED" : isRejected ? "CANCELLED" : "IN PROGRESS"}
        </div>
      </div>

      {/* Stage Progress Bar */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-1">
          {visibleStages.map((stage, idx) => {
            const stageIdx = getStageIndex(stage.id);
            const isActive = transaction.stage === stage.id;
            const isComplete = currentIdx > stageIdx || isDone;
            const isPending = currentIdx < stageIdx && !isDone;

            return (
              <div key={stage.id} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all duration-500 w-full justify-center
                  ${isComplete ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                    isActive ? `${stage.color} animate-pulse` :
                    "text-white/20 border-white/5 bg-white/2"}`}>
                  {isComplete ? <CheckCircle className="w-3 h-3" /> : stage.icon}
                  <span className="hidden sm:inline">{stage.label}</span>
                </div>
                {idx < visibleStages.length - 1 && (
                  <div className={`h-px flex-1 mx-1 transition-all duration-500 ${isComplete ? "bg-emerald-500/40" : "bg-white/5"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Field Progress (during DATA stage) */}
      {transaction.stage === "DATA" && (
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            {def.fields.filter((f) => f.required).map((field) => {
              const filled = !!transaction.fields[field.key];
              return (
                <div key={field.key} className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                  filled ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-white/30 border-white/5"
                }`}>
                  {filled ? <CheckCircle className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}
                  {field.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AMG Check indicator */}
      {transaction.amgRequired && transaction.stage === "AMG_CHECK" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-3 border-b border-white/5 flex items-center gap-3"
          style={{ background: "rgba(239,68,68,0.05)" }}
        >
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-red-400">ASTRA AMG Governance Check Required</div>
            <div className="text-[10px] text-white/40">Amount exceeds authority threshold — management approval needed</div>
          </div>
          <div className="ml-auto w-4 h-4 border-2 border-red-400/40 border-t-red-400 rounded-full animate-spin" />
        </motion.div>
      )}

      {/* Sync targets (during EXECUTE/DONE) */}
      {(transaction.stage === "EXECUTE" || isDone) && (
        <div className="px-4 py-2 border-b border-white/5">
          <div className="text-[10px] text-white/30 mb-1.5">Syncing to:</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {def.syncTargets.map((target) => (
              <div key={target} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                <Database className="w-2.5 h-2.5" />
                {target}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction ID footer */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="text-[10px] text-white/20 font-mono">{transaction.id}</div>
        <div className="text-[10px] text-white/20">{transaction.startedAt.toLocaleTimeString()}</div>
      </div>
    </motion.div>
  );
}
