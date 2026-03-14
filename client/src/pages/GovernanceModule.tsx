/**
 * ASTRA AMG — Live Governance Console
 * Design: Neural Depth — deep space dark, glass morphism, Space Grotesk
 *
 * Features:
 *   - Live ASTRA authority check (real engine call)
 *   - Real-time decision log (in-memory audit trail)
 *   - Policy Pack viewer (7 GT domains)
 *   - Authority Matrix summary
 *   - Governance score & stats
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, ArrowUpCircle,
  Play, RefreshCw, ChevronDown, ChevronRight, Eye, FileText,
  Activity, Clock, Zap, Lock, Users, Database, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import PortalLayout from "@/components/PortalLayout";
import {
  astraAuthorityCheck,
  buildAstraRequest,
  getDecisionLog,
  clearDecisionLog,
  DOMAIN_REGISTRY,
  GT_POLICY_PACK,
  type AstraDecision,
  type AstraOutcome,
} from "@/lib/astraEngine";

const FADE = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

// ─── Outcome Badge ─────────────────────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: AstraOutcome }) {
  const map = {
    ALLOW:    { icon: CheckCircle2,   color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", label: "ALLOW" },
    DENY:     { icon: XCircle,        color: "text-red-400 border-red-500/30 bg-red-500/10",             label: "DENY" },
    ESCALATE: { icon: ArrowUpCircle,  color: "text-amber-400 border-amber-500/30 bg-amber-500/10",       label: "ESCALATE" },
    DEGRADE:  { icon: AlertTriangle,  color: "text-orange-400 border-orange-500/30 bg-orange-500/10",    label: "DEGRADE" },
  };
  const { icon: Icon, color, label } = map[outcome];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Live Authority Check Panel ────────────────────────────────────────────────

const ROLES = ["staff", "manager", "director", "cfo", "ceo", "board", "hr_manager", "finance_manager", "it_manager", "qms_manager", "legal_counsel", "system"];

function LiveCheckPanel() {
  const [actorId, setActorId] = useState("user-001");
  const [actorRole, setActorRole] = useState("manager");
  const [domain, setDomain] = useState("procurement");
  const [action, setAction] = useState("approve_po");
  const [costCenter, setCostCenter] = useState("Operations");
  const [amountSar, setAmountSar] = useState("50000");
  const [consent, setConsent] = useState(true);
  const [justification, setJustification] = useState("Test governance check");
  const [lastDecision, setLastDecision] = useState<AstraDecision | null>(null);
  const [running, setRunning] = useState(false);

  const domainInfo = DOMAIN_REGISTRY.find(d => d.key === domain);
  const actions = domainInfo?.actions || [];

  const runCheck = () => {
    setRunning(true);
    setTimeout(() => {
      const req = buildAstraRequest(actorId, actorRole, domain, action, {
        cost_center: costCenter,
        amount_sar: Number(amountSar),
        consent,
        justification,
      });
      const decision = astraAuthorityCheck(req);
      setLastDecision(decision);
      setRunning(false);
      if (decision.outcome === "ALLOW") toast.success("ASTRA: ALLOW — transaction authorized");
      else if (decision.outcome === "DENY") toast.error(`ASTRA: DENY — ${decision.reason_code}`);
      else if (decision.outcome === "ESCALATE") toast.warning("ASTRA: ESCALATE — escalated to senior authority");
    }, 320);
  };

  return (
    <div className="glass-card border border-white/8 rounded-xl overflow-hidden" style={{ background: "rgba(9,14,26,0.7)" }}>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5" style={{ background: "rgba(239,68,68,0.04)" }}>
        <Zap className="w-4 h-4 text-red-400" />
        <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Live Authority Check</span>
        <Badge className="ml-auto text-[10px] bg-red-500/10 text-red-400 border-red-500/20">ASTRA Engine v{GT_POLICY_PACK.version}</Badge>
      </div>

      <div className="p-5 grid grid-cols-2 gap-3">
        {/* Actor */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Actor ID</label>
          <input
            value={actorId}
            onChange={e => setActorId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Actor Role</label>
          <select
            value={actorRole}
            onChange={e => setActorRole(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
          >
            {ROLES.map(r => <option key={r} value={r} className="bg-[#0a0f1e]">{r}</option>)}
          </select>
        </div>

        {/* Domain */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Domain</label>
          <select
            value={domain}
            onChange={e => { setDomain(e.target.value); setAction(DOMAIN_REGISTRY.find(d => d.key === e.target.value)?.actions[0]?.key || ""); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
          >
            {DOMAIN_REGISTRY.map(d => <option key={d.key} value={d.key} className="bg-[#0a0f1e]">{d.icon} {d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Action</label>
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
          >
            {actions.map(a => <option key={a.key} value={a.key} className="bg-[#0a0f1e]">{a.label}</option>)}
          </select>
        </div>

        {/* Context */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Amount (SAR)</label>
          <input
            type="number"
            value={amountSar}
            onChange={e => setAmountSar(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Cost Center</label>
          <select
            value={costCenter}
            onChange={e => setCostCenter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
          >
            {["Operations", "IT", "HR", "Finance", "Management", "Legal"].map(c => <option key={c} value={c} className="bg-[#0a0f1e]">{c}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Justification</label>
          <input
            value={justification}
            onChange={e => setJustification(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
          />
        </div>

        <div className="col-span-2 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="accent-red-500" />
            <span className="text-xs text-white/60">Consent granted</span>
          </label>
          <Button
            onClick={runCheck}
            disabled={running}
            className="ml-auto bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 text-xs"
          >
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Checking…" : "Run ASTRA Check"}
          </Button>
        </div>
      </div>

      {/* Decision Result */}
      <AnimatePresence>
        {lastDecision && (
          <motion.div
            key={lastDecision.decision_id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/5 px-5 py-4"
            style={{
              background: lastDecision.outcome === "ALLOW"
                ? "rgba(16,185,129,0.05)"
                : lastDecision.outcome === "DENY"
                ? "rgba(239,68,68,0.05)"
                : "rgba(245,158,11,0.05)"
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <OutcomeBadge outcome={lastDecision.outcome} />
                  <span className="text-[10px] text-white/40 font-mono">{lastDecision.decision_id}</span>
                </div>
                <div className="text-xs text-white/60">
                  <span className="text-white/30">Reason:</span> <span className="font-mono text-white/70">{lastDecision.reason_code}</span>
                </div>
                <div className="text-xs text-white/60">
                  <span className="text-white/30">Policy Pack:</span> <span className="text-white/70">v{lastDecision.policy_pack_version}</span>
                  <span className="text-white/30 ml-3">Latency:</span> <span className="text-white/70">{lastDecision.latency_ms}ms</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-white/30">Committed to audit log</div>
                <div className="text-[10px] text-white/20 font-mono">{new Date(lastDecision.created_at).toLocaleTimeString()}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Decision Log ──────────────────────────────────────────────────────────────

function DecisionLog() {
  const [log, setLog] = useState<AstraDecision[]>(() => getDecisionLog());
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = () => setLog(getDecisionLog());
  const clear = () => { clearDecisionLog(); setLog([]); toast.success("Decision log cleared"); };

  return (
    <div className="glass-card border border-white/8 rounded-xl overflow-hidden" style={{ background: "rgba(9,14,26,0.7)" }}>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
        <Activity className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Decision Log</span>
        <span className="text-[10px] text-white/30 ml-1">({log.length} entries)</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={refresh} className="text-white/30 hover:text-white/60 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {log.length > 0 && (
            <button onClick={clear} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {log.length === 0 ? (
          <div className="px-5 py-8 text-center text-white/20 text-sm">
            No decisions yet — run an ASTRA check above or trigger a transaction via NEO
          </div>
        ) : (
          log.map((d) => (
            <motion.div
              key={d.decision_id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="border-b border-white/5 last:border-0"
            >
              <button
                onClick={() => setExpanded(expanded === d.decision_id ? null : d.decision_id)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors text-left"
              >
                <OutcomeBadge outcome={d.outcome} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/70 truncate">
                    <span className="text-white/40">{d.actor_role}</span> → <span className="font-medium">{d.domain}/{d.action}</span>
                  </div>
                  <div className="text-[10px] text-white/30 font-mono">{d.decision_id.slice(0, 16)}…</div>
                </div>
                <div className="text-[10px] text-white/20 shrink-0">{new Date(d.created_at).toLocaleTimeString()}</div>
                {expanded === d.decision_id ? <ChevronDown className="w-3 h-3 text-white/20" /> : <ChevronRight className="w-3 h-3 text-white/20" />}
              </button>

              <AnimatePresence>
                {expanded === d.decision_id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-3 overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.01)" }}
                  >
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                      {[
                        ["Decision ID", d.decision_id],
                        ["Request ID", d.request_id],
                        ["Actor ID", d.actor_id],
                        ["Actor Role", d.actor_role],
                        ["Domain", d.domain],
                        ["Action", d.action],
                        ["Reason Code", d.reason_code],
                        ["Policy Pack", `v${d.policy_pack_version}`],
                        ["Latency", `${d.latency_ms}ms`],
                        ["Timestamp", new Date(d.created_at).toISOString()],
                      ].map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-white/30 shrink-0">{k}:</span>
                          <span className="text-white/60 font-mono truncate">{v}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Policy Pack Viewer ────────────────────────────────────────────────────────

function PolicyPackViewer() {
  const [openDomain, setOpenDomain] = useState<string | null>(null);

  return (
    <div className="glass-card border border-white/8 rounded-xl overflow-hidden" style={{ background: "rgba(9,14,26,0.7)" }}>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
        <FileText className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Policy Pack</span>
        <Badge className="ml-auto text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20">v{GT_POLICY_PACK.version}</Badge>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {DOMAIN_REGISTRY.map((domain) => (
          <div key={domain.key} className="border-b border-white/5 last:border-0">
            <button
              onClick={() => setOpenDomain(openDomain === domain.key ? null : domain.key)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors text-left"
            >
              <span className="text-base">{domain.icon}</span>
              <div className="flex-1">
                <div className={`text-sm font-medium ${domain.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{domain.label}</div>
                <div className="text-[10px] text-white/30">{domain.actions.length} actions defined</div>
              </div>
              {openDomain === domain.key ? <ChevronDown className="w-3.5 h-3.5 text-white/20" /> : <ChevronRight className="w-3.5 h-3.5 text-white/20" />}
            </button>

            <AnimatePresence>
              {openDomain === domain.key && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-3 space-y-2">
                    {domain.actions.map((action) => (
                      <div key={action.key} className="rounded-lg border border-white/5 p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="text-xs font-medium text-white">{action.label}</div>
                          <code className="text-[10px] text-white/30 font-mono shrink-0">{action.key}</code>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {action.allowRoles.map(r => (
                            <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">{r}</span>
                          ))}
                        </div>
                        {action.requires.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {action.requires.map(r => (
                              <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                <Lock className="w-2 h-2 inline mr-0.5" />{r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GovernanceModule() {
  const [, navigate] = useLocation();

  const stats = [
    { label: "Policy Pack Version", value: `v${GT_POLICY_PACK.version}`, color: "text-violet-400", icon: FileText },
    { label: "Domains Covered", value: `${DOMAIN_REGISTRY.length}`, color: "text-blue-400", icon: Database },
    { label: "Total Actions", value: `${DOMAIN_REGISTRY.reduce((s, d) => s + d.actions.length, 0)}`, color: "text-emerald-400", icon: Activity },
    { label: "Engine Status", value: "ACTIVE", color: "text-emerald-400", icon: Zap },
  ];

  return (
    <PortalLayout
      title="ASTRA AMG"
      subtitle="Authority Matrix Governance — Live Engine"
      badge="Engine Active"
      badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    >
      <div className="p-6 space-y-6 overflow-y-auto h-full">

        {/* Header Stats */}
        <motion.div variants={FADE} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              variants={FADE}
              transition={{ delay: i * 0.06 }}
              className="glass-card border border-white/8 rounded-xl p-4 flex items-center gap-3"
              style={{ background: "rgba(9,14,26,0.7)" }}
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <div className={`text-lg font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
                <div className="text-[10px] text-white/30">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Governance Score Banner */}
        <motion.div
          variants={FADE}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
          className="glass-card border border-red-500/20 p-5 rounded-xl flex items-center gap-5"
          style={{ background: "rgba(239,68,68,0.03)" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>97.2%</div>
              <div className="text-xs text-emerald-400">↑ +0.8% this month</div>
            </div>
            <div className="text-sm text-white/50">Overall Governance Score — ISO 9001 Aligned</div>
            <div className="text-[11px] text-white/30 mt-0.5">
              ASTRA-TAWZEEF-V1 · Policy Pack GT v{GT_POLICY_PACK.version} · Fail-closed · Append-only audit trail
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button
              onClick={() => navigate("/portal/governance/authority-matrix")}
              variant="outline"
              className="text-xs border-white/10 text-white/60 hover:text-white"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Authority Matrix
            </Button>
            <Button
              onClick={() => navigate("/portal/audit")}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Full Audit Log
            </Button>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: Live Check + Decision Log */}
          <div className="space-y-5">
            <motion.div variants={FADE} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
              <LiveCheckPanel />
            </motion.div>
            <motion.div variants={FADE} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
              <DecisionLog />
            </motion.div>
          </div>

          {/* Right: Policy Pack Viewer */}
          <motion.div variants={FADE} initial="hidden" animate="show" transition={{ delay: 0.18 }}>
            <PolicyPackViewer />
          </motion.div>
        </div>

        {/* Engine Info Footer */}
        <motion.div
          variants={FADE}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.25 }}
          className="glass-card border border-white/5 rounded-xl p-4"
          style={{ background: "rgba(9,14,26,0.5)" }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-white/40">ASTRA Engine: <span className="text-emerald-400 font-semibold">ACTIVE</span></span>
            </div>
            <div className="text-white/10">|</div>
            <span className="text-[11px] text-white/30">Policy: <span className="text-white/50">GT v{GT_POLICY_PACK.version}</span></span>
            <div className="text-white/10">|</div>
            <span className="text-[11px] text-white/30">Mode: <span className="text-white/50">Fail-Closed</span></span>
            <div className="text-white/10">|</div>
            <span className="text-[11px] text-white/30">Audit: <span className="text-white/50">Append-Only In-Memory</span></span>
            <div className="text-white/10">|</div>
            <span className="text-[11px] text-white/30">Based on: <span className="text-white/50">ASTRA-TAWZEEF-V1</span></span>
            <div className="text-white/10">|</div>
            <span className="text-[11px] text-white/30">ISO 9001: <span className="text-emerald-400">Compliant</span></span>
          </div>
        </motion.div>

      </div>
    </PortalLayout>
  );
}
