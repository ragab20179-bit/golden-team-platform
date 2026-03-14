/**
 * ASTRA Engine — TypeScript port of ASTRA-TAWZEEF-V1
 * Faithfully replicates: decision.py + policy_pack.py
 *
 * Design principles (from ASTRA-TAWZEEF-V1):
 *   - One request → one decision → one artifact
 *   - Fail-closed (DENY on any ambiguity)
 *   - No retries / no async
 *   - Real policy-driven authorization
 *   - Immutable audit trail
 *
 * Policy Pack: GT v2.0 — 7 Golden Team business domains
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AstraOutcome = "ALLOW" | "DENY" | "ESCALATE" | "DEGRADE";

export type AstraReasonCode =
  | "RULE_PASS"
  | "BAD_PAYLOAD"
  | "MISSING_FIELDS"
  | "UNKNOWN_ACTION"
  | "ROLE_NOT_ALLOWED"
  | `REQUIREMENT_MISSING:${string}`;

export interface AstraActor {
  id: string;
  role: string;
}

export interface AstraContext {
  domain: string;
  action: string;
  consent?: boolean;
  delegation_token?: string;
  budget_code?: string;
  vendor_approved?: boolean;
  amount_aed?: number;
  amount_sar?: number;
  cost_center?: string;
  legal_review?: boolean;
  dual_approval?: boolean;
  evidence_attached?: boolean;
  change_request_id?: string;
  justification?: string;
  [key: string]: unknown;
}

export interface AstraRequest {
  request_id: string;
  actor: AstraActor;
  context: AstraContext;
  delegation_token?: string;
  consent?: boolean;
}

export interface AstraDecision {
  decision_id: string;
  request_id: string;
  outcome: AstraOutcome;
  reason_code: AstraReasonCode;
  actor_id: string;
  actor_role: string;
  domain: string;
  action: string;
  policy_pack_version: string;
  latency_ms: number;
  created_at: string;
}

export interface ActionPolicy {
  allow_roles: string[];
  requires: string[];
  escalate_above_sar?: number;  // escalate to higher authority if amount exceeds this
  dual_approval_above_sar?: number;
}

export interface DomainPolicy {
  actions: Record<string, ActionPolicy>;
}

export interface PolicyPack {
  version: string;
  domains: Record<string, DomainPolicy>;
}

// ─── Golden Team Policy Pack v2.0 ────────────────────────────────────────────
// Extends ASTRA-TAWZEEF-V1 policy_pack.json with 7 GT business domains

export const GT_POLICY_PACK: PolicyPack = {
  version: "2.0.0-GT",
  domains: {
    // ── Domain 1: Procurement ──────────────────────────────────────────────
    procurement: {
      actions: {
        create_po: {
          allow_roles: ["staff", "manager", "director", "cfo", "ceo", "system"],
          requires: ["cost_center"],
        },
        approve_po: {
          allow_roles: ["manager", "director", "cfo", "ceo", "board", "system"],
          requires: ["cost_center"],
          escalate_above_sar: 100000,
          dual_approval_above_sar: 500000,
        },
        reject_po: {
          allow_roles: ["manager", "director", "cfo", "ceo", "system"],
          requires: [],
        },
        emergency_purchase: {
          allow_roles: ["director", "cfo", "ceo"],
          requires: ["justification", "dual_approval"],
          dual_approval_above_sar: 0,
        },
      },
    },

    // ── Domain 2: HR ───────────────────────────────────────────────────────
    hr: {
      actions: {
        submit_leave: {
          allow_roles: ["staff", "manager", "director", "cfo", "ceo", "system"],
          requires: ["consent"],
        },
        approve_leave: {
          allow_roles: ["manager", "director", "ceo", "system"],
          requires: [],
        },
        onboard_employee: {
          allow_roles: ["hr_manager", "director", "ceo", "system"],
          requires: ["consent"],
        },
        offboard_employee: {
          allow_roles: ["hr_manager", "director", "ceo"],
          requires: ["consent", "dual_approval"],
        },
        update_salary: {
          allow_roles: ["hr_manager", "cfo", "ceo"],
          requires: ["dual_approval"],
          escalate_above_sar: 20000,
        },
      },
    },

    // ── Domain 3: Finance ──────────────────────────────────────────────────
    finance: {
      actions: {
        create_invoice: {
          allow_roles: ["staff", "manager", "finance_manager", "cfo", "system"],
          requires: ["cost_center"],
        },
        approve_payment: {
          allow_roles: ["finance_manager", "cfo", "ceo", "system"],
          requires: ["cost_center"],
          escalate_above_sar: 100000,
          dual_approval_above_sar: 500000,
        },
        log_expense: {
          allow_roles: ["staff", "manager", "director", "cfo", "ceo", "system"],
          requires: ["cost_center"],
        },
        approve_budget: {
          allow_roles: ["cfo", "ceo", "board"],
          requires: ["dual_approval"],
          dual_approval_above_sar: 0,
        },
      },
    },

    // ── Domain 4: Legal ────────────────────────────────────────────────────
    legal: {
      actions: {
        create_nda: {
          allow_roles: ["staff", "manager", "legal_counsel", "ceo", "system"],
          requires: ["legal_review"],
        },
        approve_contract: {
          allow_roles: ["legal_counsel", "director", "ceo", "board"],
          requires: ["legal_review", "dual_approval"],
          escalate_above_sar: 500000,
        },
        sign_document: {
          allow_roles: ["ceo", "board", "legal_counsel"],
          requires: ["legal_review"],
        },
        terminate_contract: {
          allow_roles: ["legal_counsel", "ceo", "board"],
          requires: ["legal_review", "dual_approval", "justification"],
        },
      },
    },

    // ── Domain 5: QMS ──────────────────────────────────────────────────────
    qms: {
      actions: {
        log_nonconformance: {
          allow_roles: ["staff", "manager", "director", "qms_manager", "system"],
          requires: ["evidence_attached"],
        },
        approve_capa: {
          allow_roles: ["qms_manager", "director", "ceo", "system"],
          requires: ["evidence_attached"],
        },
        close_ncr: {
          allow_roles: ["qms_manager", "director"],
          requires: ["evidence_attached", "dual_approval"],
        },
        log_risk: {
          allow_roles: ["staff", "manager", "director", "qms_manager", "ceo", "system"],
          requires: [],
        },
      },
    },

    // ── Domain 6: IT ───────────────────────────────────────────────────────
    it: {
      actions: {
        create_ticket: {
          allow_roles: ["staff", "manager", "director", "cfo", "ceo", "system"],
          requires: [],
        },
        approve_access: {
          allow_roles: ["it_manager", "director", "ceo", "system"],
          requires: [],
        },
        deploy_change: {
          allow_roles: ["it_manager", "director", "ceo", "system"],
          requires: ["change_request_id", "dual_approval"],
        },
        revoke_access: {
          allow_roles: ["it_manager", "hr_manager", "director", "ceo"],
          requires: ["justification"],
        },
      },
    },

    // ── Domain 7: Governance ───────────────────────────────────────────────
    // DEMO DENY SCENARIOS — fail-closed behaviour demonstration
    demo: {
      actions: {
        // Board-only: any role below board gets DENY
        board_contract_approval: {
          allow_roles: ["board"],
          requires: ["legal_review", "dual_approval"],
        },
        // CEO + Board only: strategic M&A decision
        ma_decision: {
          allow_roles: ["ceo", "board"],
          requires: ["dual_approval", "legal_review", "justification"],
        },
        // Requires dual_approval — staff/manager always DENY (missing requirement)
        critical_system_shutdown: {
          allow_roles: ["it_manager", "director", "ceo", "board"],
          requires: ["dual_approval", "justification", "change_request_id"],
        },
        // Open to all — always ALLOW for comparison
        view_dashboard: {
          allow_roles: ["staff", "manager", "director", "cfo", "ceo", "board", "hr_manager", "finance_manager", "it_manager", "qms_manager", "legal_counsel", "system"],
          requires: [],
        },
      },
    },

    governance: {
      actions: {
        escalate_decision: {
          allow_roles: ["manager", "director", "cfo", "ceo", "astra", "system"],
          requires: ["justification"],
        },
        override_denial: {
          allow_roles: ["ceo", "board"],
          requires: ["dual_approval", "justification"],
        },
        audit_query: {
          allow_roles: ["ceo", "board", "qms_manager", "legal_counsel", "astra"],
          requires: [],
        },
        policy_update: {
          allow_roles: ["ceo", "board"],
          requires: ["dual_approval", "legal_review"],
        },
      },
    },

    // ── Domain 8: Interview (from ASTRA-TAWZEEF-V1 — preserved) ───────────
    interview: {
      actions: {
        start: {
          allow_roles: ["recruiter", "hr_manager", "system"],
          requires: ["consent"],
        },
        terminate: {
          allow_roles: ["recruiter", "hr_manager", "system", "astra"],
          requires: ["consent"],
        },
      },
    },

    // ── Domain 9: Watcher (from ASTRA-TAWZEEF-V1 — preserved) ─────────────
    watcher: {
      actions: {
        submit: {
          allow_roles: ["watcher"],
          requires: ["delegation_token"],
        },
      },
    },
  },
};

// ─── Requirement Checker ──────────────────────────────────────────────────────
// Exact port of _has_requirement() from decision.py

function hasRequirement(request: AstraRequest, req: string): boolean {
  const ctx = request.context || {};

  switch (req) {
    case "consent":
      if (ctx.consent === true) return true;
      if (request.consent === true) return true;
      return false;

    case "delegation_token":
      if (typeof request.delegation_token === "string" && request.delegation_token) return true;
      if (typeof ctx.delegation_token === "string" && ctx.delegation_token) return true;
      return false;

    case "cost_center":
      return typeof ctx.cost_center === "string" && ctx.cost_center.trim().length > 0;

    case "vendor_approved":
      return ctx.vendor_approved === true;

    case "legal_review":
      return ctx.legal_review === true;

    case "dual_approval":
      return ctx.dual_approval === true;

    case "evidence_attached":
      return ctx.evidence_attached === true;

    case "change_request_id":
      return typeof ctx.change_request_id === "string" && ctx.change_request_id.trim().length > 0;

    case "justification":
      return typeof ctx.justification === "string" && ctx.justification.trim().length > 0;

    case "budget_code":
      return typeof ctx.budget_code === "string" && ctx.budget_code.trim().length > 0;

    default:
      // Unknown requirement → fail-closed (exact behaviour from decision.py)
      return false;
  }
}

// ─── Core Evaluate Function ───────────────────────────────────────────────────
// Exact port of evaluate() from decision.py

function evaluate(pack: PolicyPack, request: AstraRequest): [AstraOutcome, AstraReasonCode] {
  const actor = request.actor;
  const ctx = request.context;

  // Structural validation — fail-closed
  if (!actor || typeof actor !== "object" || !ctx || typeof ctx !== "object") {
    return ["DENY", "BAD_PAYLOAD"];
  }

  const actorRole = actor.role || "";
  const domain = ctx.domain || "";
  const action = ctx.action || "";

  if (!actorRole || !domain || !action) {
    return ["DENY", "MISSING_FIELDS"];
  }

  // Policy lookup
  const domainPolicy = pack.domains[domain];
  if (!domainPolicy) {
    return ["DENY", "UNKNOWN_ACTION"];
  }

  const actionPolicy = domainPolicy.actions[action];
  if (!actionPolicy) {
    return ["DENY", "UNKNOWN_ACTION"];
  }

  // Role check
  if (!Array.isArray(actionPolicy.allow_roles) || !actionPolicy.allow_roles.includes(actorRole)) {
    return ["DENY", "ROLE_NOT_ALLOWED"];
  }

  // Requirements check
  const reqs = actionPolicy.requires || [];
  for (const req of reqs) {
    if (!hasRequirement(request, req)) {
      return ["DENY", `REQUIREMENT_MISSING:${req}`];
    }
  }

  // Escalation check (GT extension)
  const amount = ctx.amount_sar ?? ctx.amount_aed ?? 0;
  if (actionPolicy.escalate_above_sar !== undefined && amount > actionPolicy.escalate_above_sar) {
    return ["ESCALATE", "RULE_PASS"];
  }

  return ["ALLOW", "RULE_PASS"];
}

// ─── UUID Generator ───────────────────────────────────────────────────────────

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── In-Memory Audit Log ──────────────────────────────────────────────────────

const _decisionLog: AstraDecision[] = [];

export function getDecisionLog(): AstraDecision[] {
  return [..._decisionLog].reverse(); // newest first
}

export function clearDecisionLog(): void {
  _decisionLog.length = 0;
}

// ─── Main Authority Check ─────────────────────────────────────────────────────
// Equivalent to POST /v1/astra/authority/check + POST /v2/orchestrator/execute

export function astraAuthorityCheck(request: AstraRequest): AstraDecision {
  const t0 = performance.now();

  // Fail-closed: request_id required
  if (!request.request_id) {
    const decision: AstraDecision = {
      decision_id: generateUUID(),
      request_id: "MISSING",
      outcome: "DENY",
      reason_code: "BAD_PAYLOAD",
      actor_id: request.actor?.id || "unknown",
      actor_role: request.actor?.role || "unknown",
      domain: request.context?.domain || "unknown",
      action: request.context?.action || "unknown",
      policy_pack_version: GT_POLICY_PACK.version,
      latency_ms: performance.now() - t0,
      created_at: new Date().toISOString(),
    };
    _decisionLog.push(decision);
    return decision;
  }

  const [outcome, reasonCode] = evaluate(GT_POLICY_PACK, request);

  const decision: AstraDecision = {
    decision_id: generateUUID(),
    request_id: request.request_id,
    outcome,
    reason_code: reasonCode,
    actor_id: request.actor.id,
    actor_role: request.actor.role,
    domain: request.context.domain,
    action: request.context.action,
    policy_pack_version: GT_POLICY_PACK.version,
    latency_ms: Math.round((performance.now() - t0) * 100) / 100,
    created_at: new Date().toISOString(),
  };

  // Append-only artifact (mirrors insert_decision in persistence.py)
  _decisionLog.push(decision);

  return decision;
}

// ─── Helper: Build ASTRA Request from NEO Transaction ─────────────────────────

export function buildAstraRequest(
  actorId: string,
  actorRole: string,
  domain: string,
  action: string,
  contextFields: Record<string, unknown>
): AstraRequest {
  return {
    request_id: generateUUID(),
    actor: { id: actorId, role: actorRole },
    context: {
      domain,
      action,
      ...contextFields,
    },
  };
}

// ─── Domain/Action Registry (for UI) ─────────────────────────────────────────

export interface DomainInfo {
  key: string;
  label: string;
  labelAr: string;
  icon: string;
  color: string;
  actions: ActionInfo[];
}

export interface ActionInfo {
  key: string;
  label: string;
  allowRoles: string[];
  requires: string[];
}

export const DOMAIN_REGISTRY: DomainInfo[] = [
  {
    key: "procurement",
    label: "Procurement",
    labelAr: "المشتريات",
    icon: "🛒",
    color: "text-amber-400",
    actions: [
      { key: "create_po", label: "Create Purchase Order", allowRoles: ["staff", "manager", "director", "cfo", "ceo", "system"], requires: ["cost_center"] },
      { key: "approve_po", label: "Approve Purchase Order", allowRoles: ["manager", "director", "cfo", "ceo", "board", "system"], requires: ["cost_center"] },
      { key: "reject_po", label: "Reject Purchase Order", allowRoles: ["manager", "director", "cfo", "ceo", "system"], requires: [] },
      { key: "emergency_purchase", label: "Emergency Purchase", allowRoles: ["director", "cfo", "ceo"], requires: ["justification", "dual_approval"] },
    ],
  },
  {
    key: "hr",
    label: "Human Resources",
    labelAr: "الموارد البشرية",
    icon: "👥",
    color: "text-blue-400",
    actions: [
      { key: "submit_leave", label: "Submit Leave Request", allowRoles: ["staff", "manager", "director", "cfo", "ceo", "system"], requires: ["consent"] },
      { key: "approve_leave", label: "Approve Leave", allowRoles: ["manager", "director", "ceo", "system"], requires: [] },
      { key: "onboard_employee", label: "Onboard Employee", allowRoles: ["hr_manager", "director", "ceo", "system"], requires: ["consent"] },
      { key: "offboard_employee", label: "Offboard Employee", allowRoles: ["hr_manager", "director", "ceo"], requires: ["consent", "dual_approval"] },
      { key: "update_salary", label: "Update Salary", allowRoles: ["hr_manager", "cfo", "ceo"], requires: ["dual_approval"] },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    labelAr: "المالية",
    icon: "💰",
    color: "text-emerald-400",
    actions: [
      { key: "create_invoice", label: "Create Invoice", allowRoles: ["staff", "manager", "finance_manager", "cfo", "system"], requires: ["cost_center"] },
      { key: "approve_payment", label: "Approve Payment", allowRoles: ["finance_manager", "cfo", "ceo", "system"], requires: ["cost_center"] },
      { key: "log_expense", label: "Log Expense", allowRoles: ["staff", "manager", "director", "cfo", "ceo", "system"], requires: ["cost_center"] },
      { key: "approve_budget", label: "Approve Budget", allowRoles: ["cfo", "ceo", "board"], requires: ["dual_approval"] },
    ],
  },
  {
    key: "legal",
    label: "Legal",
    labelAr: "القانونية",
    icon: "⚖️",
    color: "text-violet-400",
    actions: [
      { key: "create_nda", label: "Create NDA", allowRoles: ["staff", "manager", "legal_counsel", "ceo", "system"], requires: ["legal_review"] },
      { key: "approve_contract", label: "Approve Contract", allowRoles: ["legal_counsel", "director", "ceo", "board"], requires: ["legal_review", "dual_approval"] },
      { key: "sign_document", label: "Sign Document", allowRoles: ["ceo", "board", "legal_counsel"], requires: ["legal_review"] },
      { key: "terminate_contract", label: "Terminate Contract", allowRoles: ["legal_counsel", "ceo", "board"], requires: ["legal_review", "dual_approval", "justification"] },
    ],
  },
  {
    key: "qms",
    label: "Quality Management",
    labelAr: "إدارة الجودة",
    icon: "✅",
    color: "text-cyan-400",
    actions: [
      { key: "log_nonconformance", label: "Log Non-Conformance", allowRoles: ["staff", "manager", "director", "qms_manager", "system"], requires: ["evidence_attached"] },
      { key: "approve_capa", label: "Approve CAPA", allowRoles: ["qms_manager", "director", "ceo", "system"], requires: ["evidence_attached"] },
      { key: "close_ncr", label: "Close NCR", allowRoles: ["qms_manager", "director"], requires: ["evidence_attached", "dual_approval"] },
      { key: "log_risk", label: "Log Risk", allowRoles: ["staff", "manager", "director", "qms_manager", "ceo", "system"], requires: [] },
    ],
  },
  {
    key: "it",
    label: "IT Solutions",
    labelAr: "تقنية المعلومات",
    icon: "💻",
    color: "text-rose-400",
    actions: [
      { key: "create_ticket", label: "Create IT Ticket", allowRoles: ["staff", "manager", "director", "cfo", "ceo", "system"], requires: [] },
      { key: "approve_access", label: "Approve System Access", allowRoles: ["it_manager", "director", "ceo", "system"], requires: [] },
      { key: "deploy_change", label: "Deploy Change", allowRoles: ["it_manager", "director", "ceo", "system"], requires: ["change_request_id", "dual_approval"] },
      { key: "revoke_access", label: "Revoke Access", allowRoles: ["it_manager", "hr_manager", "director", "ceo"], requires: ["justification"] },
    ],
  },
  {
    key: "demo",
    label: "DENY Demo Scenarios",
    labelAr: "سيناريوهات الرفض التجريبية",
    icon: "🚫",
    color: "text-red-500",
    actions: [
      { key: "board_contract_approval", label: "Board Contract Approval (Board only)", allowRoles: ["board"], requires: ["legal_review", "dual_approval"] },
      { key: "ma_decision", label: "M&A Decision (CEO/Board only)", allowRoles: ["ceo", "board"], requires: ["dual_approval", "legal_review", "justification"] },
      { key: "critical_system_shutdown", label: "Critical System Shutdown (requires dual approval)", allowRoles: ["it_manager", "director", "ceo", "board"], requires: ["dual_approval", "justification", "change_request_id"] },
      { key: "view_dashboard", label: "View Dashboard (all roles — always ALLOW)", allowRoles: ["staff", "manager", "director", "cfo", "ceo", "board", "hr_manager", "finance_manager", "it_manager", "qms_manager", "legal_counsel", "system"], requires: [] },
    ],
  },
  {
    key: "governance",
    label: "Governance",
    labelAr: "الحوكمة",
    icon: "🏛️",
    color: "text-red-400",
    actions: [
      { key: "escalate_decision", label: "Escalate Decision", allowRoles: ["manager", "director", "cfo", "ceo", "astra", "system"], requires: ["justification"] },
      { key: "override_denial", label: "Override Denial", allowRoles: ["ceo", "board"], requires: ["dual_approval", "justification"] },
      { key: "audit_query", label: "Audit Query", allowRoles: ["ceo", "board", "qms_manager", "legal_counsel", "astra"], requires: [] },
      { key: "policy_update", label: "Update Policy", allowRoles: ["ceo", "board"], requires: ["dual_approval", "legal_review"] },
    ],
  },
];
