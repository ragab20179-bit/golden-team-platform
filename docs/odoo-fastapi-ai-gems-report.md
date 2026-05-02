# Odoo SaaS 19.2 — FastAPI + AI Chat Data Entry: GitHub Gems Report

**Platform:** Golden Team Trading Services — `goldenteam1.odoo.com`
**Odoo Version:** `saas~19.2+e` (Enterprise, confirmed via XML-RPC `/xmlrpc/2/common`)
**Report Date:** May 2, 2026
**Prepared by:** NEO AI (Manus AI Core)

---

## Executive Summary

Golden Team is running **Odoo SaaS 19.2 Enterprise**, the most current Odoo release. The goal of this report is to identify the best open-source GitHub repositories that enable **full AI-driven data entry** across all Odoo modules through a **FastAPI middleware layer** and an **AI chat window**. The recommended architecture is a three-tier stack: the Golden Team Platform (tRPC/React) as the chat UI, a FastAPI bridge as the middleware, and Odoo's XML-RPC/JSON-RPC API as the data layer.

---

## Odoo 19.2 API Capabilities

Odoo SaaS 19.2 exposes two external API protocols:

| Protocol | Endpoint | Best For |
|----------|----------|----------|
| XML-RPC | `/xmlrpc/2/common`, `/xmlrpc/2/object` | CRUD on all models, authentication |
| JSON-RPC | `/web/dataset/call_kw` | Web session calls, wizard execution |

Both protocols support **full CRUD** on every Odoo model — `sale.order`, `purchase.order`, `account.move`, `hr.employee`, `project.task`, `stock.picking`, `res.partner`, and all others. The existing Golden Team integration already uses XML-RPC via the `server/odoo/client.ts` layer.

---

## Ranked GitHub Gems

### Tier 1 — Legendary / Excellent

#### 1. `apexive/odoo-llm` — **191 stars, 133 forks** [^1]

> "A comprehensive framework for integrating Large Language Models into Odoo. Allows seamless interaction with OpenAI, Anthropic, Ollama, and Mistral, enabling chat completions, text embeddings, and more within your Odoo environment."

This is the **most complete open-source Odoo AI framework** available. It ships as a set of native Odoo modules (not an external service), which means it runs inside Odoo itself. The architecture is directly relevant to Golden Team:

- **`llm_tool`** — a `@llm_tool` decorator framework with 6 generic CRUD tools out of the box. Any Odoo model can be exposed as an AI tool with a single decorator. This is the core mechanism for AI data entry.
- **`llm_assistant`** — builds AI assistants with custom system prompts, tool access, and streaming responses. This is the chat interface layer.
- **`llm_thread`** — manages conversation threads with PostgreSQL advisory locking to prevent concurrent writes.
- **`llm_tool_account`** — 18 accounting-specific tools (trial balance, tax reports, reconciliation, invoice creation).
- **`llm_mcp_server`** — exposes all tools via the Model Context Protocol, allowing Claude Desktop or any MCP client to connect directly.
- **Odoo 18.0 branch is current** (19.0 migration not yet released, but the XML-RPC API is identical between 18 and 19).

**Relevance to Golden Team:** The `llm_tool` CRUD framework and `llm_tool_account` module can be adapted as the tool definitions for the NEO AI Data Entry procedure. The `@llm_tool` decorator pattern is directly portable to the existing tRPC `aiDataEntry` procedure.

**GitHub:** https://github.com/apexive/odoo-llm

---

#### 2. `OCA/rest-framework` — **372 stars, 368 forks** [^2]

> "Develop your own high level REST APIs for Odoo thanks to this addon."

This is the **official OCA FastAPI integration for Odoo**. It provides:

- **`fastapi`** (v18.0.1.3.4) — Odoo FastAPI endpoint module. Mounts a FastAPI ASGI app inside the Odoo server process, giving full access to Odoo's ORM with Pydantic type validation.
- **`fastapi_auth_jwt`** — JWT bearer token authentication for FastAPI endpoints.
- **`fastapi_auth_api_key`** — API key authentication.
- **`extendable_fastapi`** — allows extending FastAPI apps from other Odoo modules.
- **`rest_log`** — tracks all REST API calls in the database.

**Critical note for Odoo SaaS 19.2:** This module must be installed **inside** the Odoo instance. Since Golden Team uses **Odoo SaaS** (cloud-hosted), custom module installation is not available. However, the OCA rest-framework pattern is the reference architecture for building the **external FastAPI bridge** (running outside Odoo) that proxies calls to Odoo's XML-RPC API.

**GitHub:** https://github.com/OCA/rest-framework

---

#### 3. `rosenvladimirov/odoo-claude-mcp` — **15 stars, 5 forks** [^3]

> "Self-hosted MCP server connecting Claude to Odoo 15→19 — 197+ tools, multi-tenant, Bulgaria l10n"

This is the **only open-source project explicitly tested on Odoo 19**. It exposes 197+ tools via the Model Context Protocol, including:

- `odoo_create`, `odoo_write`, `odoo_unlink` — full CRUD on any model
- `odoo_search_read` — parameterized search with domain filters
- `odoo_fields_get` — introspect any model's fields dynamically
- `odoo_web_login`, `odoo_web_call` — web session support for wizard execution
- `odoo_attachment_upload` / `odoo_attachment_download` — file handling
- `odoo_report` — generate PDF/XLSX reports
- `ai_tokenize_record`, `ai_search_similar` — Qdrant vector embeddings per Odoo record
- `memory_read`, `memory_write` — per-user persistent memory across sessions

**Architecture:** The MCP server runs as a standalone Python process (not inside Odoo), communicates with Odoo via XML-RPC, and exposes tools over HTTP. This is **exactly the FastAPI bridge pattern** needed for Golden Team.

**Odoo 19 fix included:** The repo includes a specific `Odoo 19 403 fix` commit, confirming active maintenance for the current version.

**GitHub:** https://github.com/rosenvladimirov/odoo-claude-mcp

---

### Tier 2 — Solid

#### 4. `dkubiak789/odoo-fastapi` — **0 stars** (new, reference implementation) [^4]

> "A FastAPI application that provides a REST API interface for Odoo 18."

A clean, minimal reference implementation showing the correct pattern for an **external FastAPI bridge** to Odoo. It covers Partners, Products, and Sales Orders with Swagger UI documentation. While it has no stars (very new), the code quality and architecture are sound and directly usable as a starting template.

**Endpoints exposed:**
- `GET /partners` — list partners with limit
- `GET /products` — list products with limit
- `GET /orders` — list sales orders with limit

**GitHub:** https://github.com/dkubiak789/odoo-fastapi

---

#### 5. `JineshPrajapat/odoo_ai_agent` — **0 stars** (new, FastAPI + RAG + Odoo 18) [^5]

> "AI Agent on top of Odoo ERP"

A FastAPI + JWT + LLM agent + RAG chatbot built specifically for Odoo 18. Uses multi-layer LLM input for token optimization. Topics: `fastapi`, `llm-agent`, `rag-chatbot`, `odoo-18`. The architecture is the closest match to what Golden Team needs: a FastAPI service that accepts natural language, routes to an LLM agent, and executes Odoo operations.

**GitHub:** https://github.com/JineshPrajapat/odoo_ai_agent

---

## Recommended Integration Architecture for Golden Team

The following architecture integrates the best patterns from all five gems into the existing Golden Team platform:

```
┌─────────────────────────────────────────────────────────┐
│              Golden Team Platform (React/tRPC)           │
│  /portal/odoo/ai-entry  ←→  trpc.odoo.aiDataEntry       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS POST
                         ▼
┌─────────────────────────────────────────────────────────┐
│         NEO FastAPI Bridge  (new Python service)         │
│  POST /ai/chat  →  LLM (OpenAI/Claude)  →  Tool Router  │
│  Tools: create_sale_order, create_purchase_order,        │
│         create_invoice, create_employee, create_partner, │
│         search_products, get_stock, run_report           │
└────────────────────────┬────────────────────────────────┘
                         │ XML-RPC
                         ▼
┌─────────────────────────────────────────────────────────┐
│         Odoo SaaS 19.2 Enterprise                        │
│         goldenteam1.odoo.com                             │
│  Models: sale.order, purchase.order, account.move,       │
│          hr.employee, project.task, stock.picking,       │
│          res.partner, product.product                    │
└─────────────────────────────────────────────────────────┘
```

---

## Module Coverage Matrix

The following table maps each Odoo module to the AI data entry operations that can be enabled through the FastAPI bridge:

| Odoo Module | Model | AI Operations | Source Gem |
|-------------|-------|---------------|------------|
| Sales | `sale.order` | Create order, add lines, confirm, cancel | odoo-claude-mcp, odoo-llm |
| Purchase | `purchase.order` | Create PO, add lines, approve, receive | odoo-claude-mcp, odoo-llm |
| Accounting | `account.move` | Create invoice, register payment, reconcile | odoo-llm (llm_tool_account) |
| Inventory | `stock.picking` | Create transfer, validate, adjust stock | odoo-claude-mcp |
| HR | `hr.employee` | Create employee, update contract, leave request | odoo-claude-mcp |
| Projects | `project.task` | Create task, assign, log timesheet | odoo-claude-mcp |
| CRM | `crm.lead` | Create lead, convert to opportunity, schedule activity | odoo-claude-mcp |
| Contacts | `res.partner` | Create/update customer, supplier, address | dkubiak789/odoo-fastapi |
| Products | `product.product` | Create product, set price, update stock | dkubiak789/odoo-fastapi |
| Payroll | `hr.payslip` | Generate payslip, validate | odoo-claude-mcp |

---

## Implementation Plan: NEO FastAPI Bridge

The recommended implementation is a **standalone Python FastAPI service** that runs alongside the Golden Team platform. It uses the tool-calling pattern from `apexive/odoo-llm` and the MCP tool definitions from `rosenvladimirov/odoo-claude-mcp`.

### Step 1: FastAPI Bridge Service (Python)

```python
# neo_odoo_bridge/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import xmlrpc.client

app = FastAPI(title="NEO Odoo Bridge", version="1.0.0")

ODOO_URL = "https://goldenteam1.odoo.com"
ODOO_DB  = "goldenteam1"

# Tool definitions — one per Odoo operation
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_sale_order",
            "description": "Create a sales order in Odoo with customer and order lines",
            "parameters": {
                "type": "object",
                "properties": {
                    "partner_id": {"type": "integer", "description": "Customer ID"},
                    "order_lines": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "product_id": {"type": "integer"},
                                "product_uom_qty": {"type": "number"},
                                "price_unit": {"type": "number"}
                            },
                            "required": ["product_id", "product_uom_qty", "price_unit"]
                        }
                    }
                },
                "required": ["partner_id", "order_lines"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_purchase_order",
            "description": "Create a purchase order (RFQ) in Odoo",
            "parameters": {
                "type": "object",
                "properties": {
                    "partner_id": {"type": "integer", "description": "Supplier ID"},
                    "order_lines": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "product_id": {"type": "integer"},
                                "product_qty": {"type": "number"},
                                "price_unit": {"type": "number"}
                            }
                        }
                    }
                },
                "required": ["partner_id", "order_lines"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_partners",
            "description": "Search for customers or suppliers by name",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Partner name to search"}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Search for products by name",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Product name to search"}
                },
                "required": ["name"]
            }
        }
    }
]

class ChatRequest(BaseModel):
    message: str
    odoo_api_key: str  # passed from server-side, never exposed to client

def odoo_execute(api_key: str, model: str, method: str, args: list, kwargs: dict = {}):
    """Execute an Odoo XML-RPC call using API key auth."""
    common = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/common")
    uid = common.authenticate(ODOO_DB, "__api__", api_key, {})
    if not uid:
        raise HTTPException(status_code=401, detail="Odoo authentication failed")
    obj = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/object")
    return obj.execute_kw(ODOO_DB, uid, api_key, model, method, args, kwargs)

@app.post("/ai/chat")
async def ai_chat(req: ChatRequest):
    client = OpenAI()  # uses OPENAI_API_KEY env var
    
    messages = [
        {"role": "system", "content": (
            "You are NEO, an AI assistant for Golden Team Trading Services. "
            "You help users create and manage records in Odoo ERP. "
            "When the user asks you to create or update records, use the available tools. "
            "Always confirm the details before executing. "
            "Respond in the same language as the user (Arabic or English)."
        )},
        {"role": "user", "content": req.message}
    ]
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=TOOLS,
        tool_choice="auto"
    )
    
    msg = response.choices[0].message
    
    # If the model wants to call a tool, return it for user confirmation
    if msg.tool_calls:
        tool_call = msg.tool_calls[0]
        return {
            "type": "tool_call",
            "tool": tool_call.function.name,
            "arguments": tool_call.function.arguments,
            "message": msg.content or f"I'll {tool_call.function.name.replace('_', ' ')} with these details. Please confirm."
        }
    
    return {"type": "text", "message": msg.content}

@app.post("/ai/execute")
async def ai_execute(tool: str, arguments: dict, api_key: str):
    """Execute a confirmed tool call against Odoo."""
    if tool == "create_sale_order":
        lines = [(0, 0, {
            "product_id": line["product_id"],
            "product_uom_qty": line["product_uom_qty"],
            "price_unit": line["price_unit"]
        }) for line in arguments["order_lines"]]
        order_id = odoo_execute(api_key, "sale.order", "create", [{
            "partner_id": arguments["partner_id"],
            "order_line": lines
        }])
        return {"success": True, "record_id": order_id, "model": "sale.order"}
    
    elif tool == "create_purchase_order":
        lines = [(0, 0, {
            "product_id": line["product_id"],
            "product_qty": line["product_qty"],
            "price_unit": line["price_unit"]
        }) for line in arguments["order_lines"]]
        po_id = odoo_execute(api_key, "purchase.order", "create", [{
            "partner_id": arguments["partner_id"],
            "order_line": lines
        }])
        return {"success": True, "record_id": po_id, "model": "purchase.order"}
    
    elif tool == "search_partners":
        partners = odoo_execute(api_key, "res.partner", "search_read",
            [[["name", "ilike", arguments["name"]]]],
            {"fields": ["id", "name", "email", "phone"], "limit": 10})
        return {"success": True, "records": partners}
    
    elif tool == "search_products":
        products = odoo_execute(api_key, "product.product", "search_read",
            [[["name", "ilike", arguments["name"]]]],
            {"fields": ["id", "name", "list_price", "qty_available"], "limit": 10})
        return {"success": True, "records": products}
    
    raise HTTPException(status_code=400, detail=f"Unknown tool: {tool}")
```

### Step 2: Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install fastapi uvicorn openai xmlrpc pydantic python-dotenv
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 3: Integration with Existing tRPC Procedure

The existing `odoo.aiDataEntry` tRPC procedure in `server/routers/odoo.ts` should be updated to call the FastAPI bridge instead of calling the LLM directly:

```typescript
// In server/routers/odoo.ts — updated aiDataEntry procedure
aiDataEntry: protectedProcedure
  .input(z.object({ message: z.string(), confirm: z.boolean().optional() }))
  .mutation(async ({ input, ctx }) => {
    const bridgeUrl = process.env.NEO_FASTAPI_BRIDGE_URL ?? "http://localhost:8000";
    const response = await fetch(`${bridgeUrl}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input.message,
        odoo_api_key: env.odooApiKey
      })
    });
    return response.json();
  }),
```

---

## Compatibility Matrix: Odoo SaaS 19.2

| Gem | Odoo 19 Compatible | Deployment Mode | Stars | Last Commit |
|-----|-------------------|-----------------|-------|-------------|
| `apexive/odoo-llm` | Partial (18.0 branch, API identical) | Inside Odoo (SaaS: N/A) | 191 | May 2026 |
| `OCA/rest-framework` | Partial (18.0 branch) | Inside Odoo (SaaS: N/A) | 372 | Apr 2026 |
| `rosenvladimirov/odoo-claude-mcp` | **Full (explicit 19 fix)** | External service | 15 | Apr 2026 |
| `dkubiak789/odoo-fastapi` | Compatible (XML-RPC) | External service | 0 | Jul 2025 |
| `JineshPrajapat/odoo_ai_agent` | Compatible (XML-RPC) | External service | 0 | Nov 2025 |

**Key finding:** Because Golden Team uses **Odoo SaaS** (cloud-hosted), modules cannot be installed inside Odoo. The correct approach is an **external FastAPI bridge** that communicates with Odoo via XML-RPC. The `rosenvladimirov/odoo-claude-mcp` and `dkubiak789/odoo-fastapi` repos are the most directly applicable references for this pattern.

---

## Immediate Action Plan

The following three steps can be executed within the current sprint to deliver full AI data entry across all Odoo modules:

**Step 1 — Clone and adapt `rosenvladimirov/odoo-claude-mcp`** as the NEO FastAPI bridge. Its `odoo-rpc-mcp/` directory contains the complete XML-RPC client, tool definitions, and authentication middleware. Replace the MCP transport with a FastAPI HTTP transport.

**Step 2 — Port `apexive/odoo-llm` tool definitions** (`llm_tool_account` for accounting, `llm_tool` CRUD tools) as Python function definitions in the FastAPI bridge. These are the most battle-tested tool schemas available for Odoo.

**Step 3 — Update the existing `trpc.odoo.aiDataEntry` procedure** to call the FastAPI bridge via HTTP, and update the `OdooAIDataEntry.tsx` page to handle the two-phase flow (parse → confirm → execute) that the bridge returns.

---

## References

[^1]: apexive/odoo-llm — https://github.com/apexive/odoo-llm
[^2]: OCA/rest-framework — https://github.com/OCA/rest-framework
[^3]: rosenvladimirov/odoo-claude-mcp — https://github.com/rosenvladimirov/odoo-claude-mcp
[^4]: dkubiak789/odoo-fastapi — https://github.com/dkubiak789/odoo-fastapi
[^5]: JineshPrajapat/odoo_ai_agent — https://github.com/JineshPrajapat/odoo_ai_agent
