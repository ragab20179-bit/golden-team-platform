# Golden Team Platform — Odoo ERP Integration Report

**Document:** GT-ERP-001  
**Version:** 1.0  
**Date:** 2026-05-02  
**Author:** Manus AI / Golden Team Technology Division  
**Odoo Instance:** `goldenteam1.odoo.com` (DB: `golden-team-1`)  
**Stack:** Node.js 22 + tRPC 11 + TypeScript 5.9 + Drizzle ORM + React 19

---

## Executive Summary

The Golden Team Platform maintains a **live, production-grade integration** with Odoo ERP (Community/Enterprise, hosted at `goldenteam1.odoo.com`). The integration covers seven functional modules — Purchase, Accounting, Inventory, CRM, HR, Project Management, and Partners — exposed as 31 typed tRPC procedures consumed by the React frontend. Authentication uses the Odoo JSON-RPC 2.0 API Key protocol with a Redis-cached XML-RPC UID fallback. A three-domain circuit breaker (read / write / auth) provides automatic fault isolation and graceful degradation when the Odoo server is unreachable.

As of this report, all read procedures return empty arrays (not errors) when the breaker is open, ensuring the portal loads cleanly in offline or degraded conditions. Write mutations continue to throw explicit errors so users are never silently misled about failed data entry operations.

---

## 1. Connection Architecture

### 1.1 Protocol

The integration supports three protocol modes, selectable via the `ODOO_PROTOCOL` environment variable:

| Mode | Protocol | Auth | Status |
|------|----------|------|--------|
| `jsonrpc-2` | JSON-RPC 2.0 over HTTPS | API Key (Bearer header) | **Default / Recommended** |
| `xmlrpc` | XML-RPC over HTTPS | Username + Password (UID cached in Redis) | Legacy fallback |
| `parallel` | Both simultaneously | Both | Shadow testing / divergence detection |

The JSON-RPC 2.0 path is stateless, does not require session management, and is the recommended production mode. The XML-RPC path is retained for backward compatibility and parallel validation during the transition window.

### 1.2 Authentication

**JSON-RPC 2.0 (primary):** Every request includes an `Authorization: Bearer <ODOO_API_KEY>` header. The API key is stored as a platform secret (`ODOO_API_KEY`) and never exposed to the client.

**XML-RPC (fallback):** Authentication calls `common.authenticate(db, username, password, {})` to obtain a numeric UID. The UID is cached in Redis DB 0 with an 8-hour TTL matching Odoo's default session lifetime. All Node.js instances share the same cached UID, preventing redundant authentication on cold starts or multi-instance deployments.

### 1.3 Circuit Breaker Architecture

Three independent circuit breakers protect the integration from cascading failures:

| Breaker | Domain | Timeout | Error Threshold | Reset Timeout |
|---------|--------|---------|-----------------|---------------|
| `odoo.read` | All read operations (`search_read`, `search_count`, etc.) | 10 s | 50% | 30 s |
| `odoo.write` | All write operations (`create`, `write`, `action_*`) | 15 s | 30% | 60 s |
| `odoo.auth` | Authentication only | 5 s | 30% | 60 s |

The read breaker uses a more permissive threshold (50%) because transient read failures have lower impact than write failures. When the read breaker opens, all read tRPC procedures return empty arrays and a `stale: true` flag, allowing the UI to display an offline banner without crashing. Write mutations always throw explicit `TRPCError` so the user is informed of failed operations.

---

## 2. Module Coverage

### 2.1 Purchase Module (`purchase.order`, `purchase.order.line`)

The Purchase module is the most complete integration, covering the full purchase-to-receive lifecycle.

| Procedure | Type | Odoo Model | Description |
|-----------|------|------------|-------------|
| `getPurchaseOrders` | Query | `purchase.order` | List all POs with status, supplier, amount, date |
| `getPurchaseOrderLines` | Query | `purchase.order.line` | Line items for a specific PO or all POs |
| `getSuppliers` | Query | `res.partner` | Suppliers (supplier_rank > 0) |
| `createPurchaseOrder` | Mutation | `purchase.order` | Create PO with line items |
| `confirmPurchaseOrder` | Mutation | `purchase.order` | Trigger `button_confirm` workflow |
| `validateStockPicking` | Mutation | `stock.picking` | Receive goods (`button_validate`) |

**Key fields tracked:** `name`, `partner_id`, `date_order`, `date_approve`, `state`, `amount_total`, `currency_id`, `notes`, `order_line`.

### 2.2 Accounting Module (`account.move`, `account.payment`, `account.account`)

| Procedure | Type | Odoo Model | Description |
|-----------|------|------------|-------------|
| `getInvoices` | Query | `account.move` | Vendor bills and customer invoices, filterable by type |
| `getPayments` | Query | `account.payment` | Payment records with journal and partner |
| `getChartOfAccounts` | Query | `account.account` | Full chart of accounts |
| `createInvoice` | Mutation | `account.move` | Create vendor bill or customer invoice with line items |
| `postInvoice` | Mutation | `account.move` | Confirm draft invoice (`action_post`) |
| `registerPayment` | Mutation | `account.payment` | Create and post payment, reconcile with invoice |

**Key fields tracked:** `move_type`, `partner_id`, `invoice_date`, `payment_state`, `amount_total`, `amount_residual`, `state`, `ref`, `invoice_line_ids`.

### 2.3 Inventory Module (`product.product`, `stock.picking`, `stock.warehouse`, `stock.quant`)

| Procedure | Type | Odoo Model | Description |
|-----------|------|------------|-------------|
| `getProducts` | Query | `product.product` | Product catalogue with stock levels and pricing |
| `getStockPickings` | Query | `stock.picking` | Receipts, deliveries, and internal transfers |
| `getWarehouses` | Query | `stock.warehouse` | Warehouse list with location codes |
| `searchProducts` | Query | `product.product` | Full-text product search by name |
| `getLiveStockLevels` | Query | `stock.quant` | Real-time stock quantities per product per location |

**Key fields tracked:** `name`, `default_code`, `qty_available`, `list_price`, `categ_id`, `uom_id`, `location_id`, `reserved_quantity`, `available_quantity`.

### 2.4 CRM Module (`crm.lead`, `crm.stage`)

| Procedure | Type | Odoo Model | Description |
|-----------|------|------------|-------------|
| `getCrmLeads` | Query | `crm.lead` | Opportunities and leads with stage and revenue |
| `getCrmStages` | Query | `crm.stage` | Pipeline stages |
| `createCrmLead` | Mutation | `crm.lead` | Create new opportunity |
| `updateCrmLeadStage` | Mutation | `crm.lead` | Move lead to a different pipeline stage |

**Key fields tracked:** `name`, `partner_id`, `stage_id`, `expected_revenue`, `probability`, `date_deadline`, `user_id`, `phone`, `email_from`, `description`.

### 2.5 HR Module (`hr.employee`, `hr.payslip`, `hr.leave`)

| Procedure | Type | Odoo Model | Description |
|-----------|------|------------|-------------|
| `getEmployees` | Query | `hr.employee` | Active employees with department and contact info |
| `getPayslips` | Query | `hr.payslip` | Payslips filterable by employee and date range |
| `createLeaveRequest` | Mutation | `hr.leave` | Submit time-off request for an employee |

**Key fields tracked:** `name`, `job_title`, `job_id`, `department_id`, `work_email`, `work_phone`, `mobile_phone`, `coach_id`, `parent_id`, `date_from`, `date_to`, `state`, `net_wage`.

### 2.6 Project Module (`project.project`, `project.task`)

| Procedure | Type | Odoo Model | Description |
|-----------|------|------------|-------------|
| `getProjects` | Query | `project.project` | All projects with partner and date info |
| `getProjectTasks` | Query | `project.task` | Tasks filterable by project |
| `createProject` | Mutation | `project.project` | Create new project |
| `createTask` | Mutation | `project.task` | Add task to a project |

**Key fields tracked:** `name`, `partner_id`, `date_start`, `date`, `description`, `task_count`, `project_id`, `stage_id`, `priority`, `date_deadline`, `user_ids`, `tag_ids`.

### 2.7 Partners Module (`res.partner`)

| Procedure | Type | Odoo Model | Description |
|-----------|------|------------|-------------|
| `getPartners` | Query | `res.partner` | All partners, filterable by supplier/customer rank |

**Key fields tracked:** `name`, `email`, `phone`, `mobile`, `street`, `city`, `country_id`, `supplier_rank`, `customer_rank`, `vat`, `website`.

### 2.8 Dashboard Stats

| Procedure | Type | Description |
|-----------|------|-------------|
| `getStats` | Query | Aggregate counts: POs, invoices, products, suppliers, CRM leads, projects, tasks |
| `getHealth` | Query | Live circuit breaker state: read / write / auth breaker status |

---

## 3. Data Flow Architecture

```
Browser (React 19)
    │
    │  tRPC useQuery / useMutation
    ▼
Express Server (Node.js 22)
    │
    │  protectedProcedure (JWT session cookie)
    ▼
server/routers/odoo.ts (31 procedures)
    │
    │  safeRead() / handleOdooError()
    ▼
server/odoo/helpers.ts (odooSearchRead, odooCreate, odooWrite, odooAction)
    │
    │  Circuit Breaker (opossum)
    │  odoo.read  → 10s timeout, 50% threshold, 30s reset
    │  odoo.write → 15s timeout, 30% threshold, 60s reset
    │  odoo.auth  → 5s timeout,  30% threshold, 60s reset
    ▼
server/odoo/client.ts (JSON-RPC 2.0 / XML-RPC dispatcher)
    │
    │  HTTPS + API Key Bearer token
    ▼
goldenteam1.odoo.com (Odoo ERP)
    DB: golden-team-1
```

---

## 4. Error Handling Strategy

The integration implements a two-tier error handling strategy:

**Tier 1 — Read queries (graceful degradation):** When the circuit breaker is open or Odoo is unreachable, all read procedures return empty arrays and a `stale: true` flag. The `OdooDashboard` page detects this via the `getHealth` procedure and displays an offline banner. This ensures the portal remains functional and navigable even when Odoo is down.

**Tier 2 — Write mutations (explicit failure):** Create, update, and workflow action mutations always throw `TRPCError` with a descriptive message when they fail. This prevents silent data loss and ensures the user is always informed when a write operation fails.

The `isBreakerOpen()` helper detects breaker-open errors by matching the error message against known patterns (`"Breaker is open"`, `"circuit breaker"`, `"open state"`). The `safeRead<T>()` wrapper applies Tier 1 logic to any read function, keeping the router procedures clean and consistent.

---

## 5. AI Data Entry Capability (Phase 23)

### 5.1 Overview

The AI Data Entry system allows users to describe business operations in natural language — in English or Arabic — and have the NEO AI agent parse the intent, extract structured fields, confirm the operation with the user, and execute it directly into Odoo ERP via the existing tRPC mutation procedures.

### 5.2 Supported AI-Executable Operations

| Natural Language Intent | Odoo Operation | tRPC Procedure |
|------------------------|----------------|----------------|
| "Create a PO for 50 units of product X from supplier Y at SAR 200 each" | Create Purchase Order | `odoo.createPurchaseOrder` |
| "Confirm PO #123" | Confirm Purchase Order | `odoo.confirmPurchaseOrder` |
| "Create an invoice for partner Z for services rendered, SAR 5,000" | Create Invoice | `odoo.createInvoice` |
| "Post invoice #456" | Post Invoice | `odoo.postInvoice` |
| "Register payment of SAR 3,000 for invoice #789" | Register Payment | `odoo.registerPayment` |
| "Add a new CRM opportunity: client ABC, expected revenue SAR 50,000" | Create CRM Lead | `odoo.createCrmLead` |
| "Move opportunity XYZ to Proposal stage" | Update CRM Stage | `odoo.updateCrmLeadStage` |
| "Create a project: KDP Phase 2, start Jan 2026" | Create Project | `odoo.createProject` |
| "Add task: Review design documents, deadline Feb 2026, project KDP Phase 2" | Create Task | `odoo.createTask` |
| "Submit leave request for employee Ahmed, 3 days from Jan 15" | Create Leave Request | `odoo.createLeaveRequest` |

### 5.3 AI Processing Pipeline

The AI data entry pipeline follows a four-step workflow:

1. **Parse:** The user types a natural language instruction. The `odoo.aiDataEntry` tRPC procedure sends the instruction to the LLM with a structured JSON schema prompt, extracting the operation type and all required fields.

2. **Validate:** The extracted fields are validated against the Zod schemas of the target mutation procedure. Missing required fields trigger a clarification request back to the user.

3. **Confirm:** The AI presents a structured summary of the operation to be executed (e.g., "I will create a Purchase Order for 50 units of Item X from Supplier Y at SAR 200 each, total SAR 10,000. Confirm?"). The user approves or cancels.

4. **Execute:** Upon confirmation, the procedure calls the appropriate Odoo mutation. The result (new record ID, success status) is returned and displayed to the user.

### 5.4 LLM Prompt Design

The system prompt for the AI data entry agent includes:

- The full list of supported Odoo operations with their required and optional fields.
- Live context injected at runtime: available products (from `searchProducts`), active suppliers (from `getSuppliers`), CRM stages (from `getCrmStages`), and active projects (from `getProjects`).
- Explicit instructions to ask clarifying questions when required fields are missing rather than guessing.
- Arabic language support — the agent responds in the same language the user writes in.

---

## 6. Gaps and Recommended Enhancements

The following capabilities are identified as gaps in the current integration and are recommended for future phases:

| Gap | Priority | Effort | Description |
|-----|----------|--------|-------------|
| Sales Orders (`sale.order`) | High | Medium | No `getSalesOrders` or `createSalesOrder` procedure. Needed for the full order-to-cash cycle. |
| Analytic Lines (`account.analytic.line`) | High | Low | Cost allocation and project profitability tracking. |
| Leave Balances (`hr.leave.allocation`) | Medium | Low | Current HR integration creates leaves but cannot check remaining balance. |
| Vendor Price Lists (`product.supplierinfo`) | Medium | Medium | Needed for AI to suggest the correct `price_unit` when creating POs. |
| Odoo Webhook / Push Notifications | High | High | Currently all data is pull-based. Real-time push from Odoo on PO confirmation, invoice payment, etc. would eliminate polling. |
| Batch Operations | Medium | Medium | Creating multiple PO lines or invoice lines in a single AI instruction requires a batch mutation endpoint. |
| Odoo Document Attachments | Low | Medium | Upload files (PDFs, images) to Odoo records from the Drive Vault. |
| Multi-currency Support | Medium | Low | The `currency_id` field is tracked but not exposed in the UI or AI prompts. |

---

## 7. Security Considerations

All Odoo API calls are made server-side within tRPC `protectedProcedure` handlers, which require a valid JWT session cookie. The `ODOO_API_KEY`, `ODOO_USERNAME`, `ODOO_URL`, and `ODOO_DB` values are stored as platform secrets and are never sent to the browser. The Odoo API key is rotated independently of the application code.

The AI data entry pipeline includes a mandatory human confirmation step before any write operation is executed. This prevents the AI from making unintended changes to Odoo data without explicit user approval.

---

## 8. Test Coverage

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `server/odoo/__tests__/` | 18 | Circuit breaker logic, helper functions, module queries |
| `server/routers/odoo.test.ts` | 12 | tRPC procedure input validation, error handling |
| **Total** | **30** | All procedures covered |

---

## References

1. Odoo JSON-RPC 2.0 API Documentation — https://www.odoo.com/documentation/17.0/developer/reference/external_api.html
2. Opossum Circuit Breaker Library — https://nodeshift.dev/opossum/
3. Golden Team Platform GitHub — https://github.com/ragab20179-bit/golden-team-platform
4. tRPC v11 Documentation — https://trpc.io/docs/v11
