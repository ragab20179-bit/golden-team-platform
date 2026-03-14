# Golden Team Trading Services — Enterprise Platform

> **Administrative & Business Development Services · IT Solutions · ASTRA PM Project Management**

A full-stack enterprise platform powered by the **NEO AI Core** (80% Manus + 20% GPT-4), featuring a client-facing corporate website and a secure employee portal with 12 integrated business modules.

---

## Platform Architecture

### Public Corporate Website
- **Home** — Hero, services overview, NEO AI intro, roadmap
- **IT Solutions** — Full service catalog, tech stack, case studies
- **ASTRA PM** — Project management product page, features, demo request
- **Consultancy** — Service lines, methodology, engagement model
- **About Us** — Company story, team, values, ISO certifications
- **Contact** — Lead capture form with service selector

### Employee Portal (Secure)
- **NEO AI Dashboard** — 55% chat window with full conversational transaction engine
- **HR System** — Employee management, leave, payroll, onboarding
- **Odoo ERP** — Financial management, invoicing, reconciliation
- **CRM** — AI-assisted pipeline, leads, quotations
- **KPI Dashboard** — Real-time metrics, Metabase integration
- **Procurement** — PO management, vendor RFQs, ASTRA AMG approvals
- **QMS / ISO 9001** — Non-conformances, CAPA, audit management
- **Legal Module** — Contract lifecycle, e-signatures, compliance
- **Inter-Corporate Comms** — Decision approvals, announcements
- **Audit & Logs** — Immutable hash-chain activity log
- **ASTRA AMG Governance** — Authority matrix, policy enforcement
- **ASTRA Meeting Assistant** — AI-powered meeting management
- **Hybrid NEO Core** — Architecture visualization

### Admin Panel
- Dashboard, User Management, Roles & Permissions, Module Access Control
- System Settings, Platform Health Monitor, Admin Audit Log

---

## NEO AI Transaction Engine

The portal chat supports **7 conversational transaction types** via a 5-stage flow:

| Stage | Description |
|:---|:---|
| **1. Intent** | Natural language detection of transaction type |
| **2. Data Gathering** | Field-by-field questions to collect all required data |
| **3. Confirmation** | Full summary presented for user review |
| **4. ASTRA AMG Check** | Governance validation against authority matrix |
| **5. Execute & Sync** | Transaction processed and data synchronized |

**Supported transactions:** Purchase Orders · Sales Quotes · Leave Approvals · Meeting Scheduling · NDA Drafting · Expense Claims · IT Support Tickets

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| Animations | Framer Motion |
| Routing | Wouter |
| Charts | Recharts |
| Build | Vite 7 |
| Design System | Neural Depth (Space Grotesk, glass morphism, bioluminescent accents) |

---

## Infrastructure (Production)

See `gt-neo-deploy/` for the complete Docker Compose deployment package:
- PostgreSQL 16 + pgvector + TimescaleDB
- Redis 7.2 (5 DB roles: Cache, Queues, Sessions, Pub/Sub, Rate Limiting)
- Odoo 19.0 Community + OCA modules
- OrangeHRM, OpenProject, Metabase, Rocket.Chat, Outline, MinIO
- Nginx SSL reverse proxy

---

## Development

```bash
pnpm install
pnpm dev
```

---

*© 2026 Golden Team Trading Services. All rights reserved.*
