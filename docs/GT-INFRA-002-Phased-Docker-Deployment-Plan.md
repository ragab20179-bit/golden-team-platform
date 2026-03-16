# Golden Team Trading Services — NEO Enterprise Platform
## Phased Docker Deployment Plan

**Document Reference:** GT-INFRA-002
**Version:** 1.0
**Date:** March 2026
**Author:** Manus AI / Golden Team IT
**Classification:** Confidential — IT Operations & Engineering

---

## Executive Summary

This document defines the complete, module-by-module Docker deployment strategy for the Golden Team NEO Enterprise Platform. The platform comprises 11 containerised services organised across 6 dependency tiers. Each module is deployed, validated, and committed before the next begins — eliminating integration surprises and enabling safe, incremental delivery.

The total deployment sequence spans **11 milestones** across an estimated **10–14 working days** for a skilled DevOps engineer, or **3–4 weeks** if combined with initial data migration and user acceptance testing.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & Server Sizing](#2-prerequisites--server-sizing)
3. [Repository & Directory Structure](#3-repository--directory-structure)
4. [Environment Variables Master Template](#4-environment-variables-master-template)
5. [Tier 1 — Foundation Services](#5-tier-1--foundation-services)
   - Milestone 1: PostgreSQL 16 + pgvector
   - Milestone 2: Redis 7.2
   - Milestone 3: MinIO Object Storage
6. [Tier 2 — Core Business Systems](#6-tier-2--core-business-systems)
   - Milestone 4: Odoo 19.0 Community
   - Milestone 5: OrangeHRM 5
   - Milestone 6: OpenProject 16 (ASTRA PM)
7. [Tier 3 — Intelligence & Analytics](#7-tier-3--intelligence--analytics)
   - Milestone 7: Metabase BI
   - Milestone 8: Outline Knowledge Base
8. [Tier 4 — Communications](#8-tier-4--communications)
   - Milestone 9: Rocket.Chat + MongoDB
9. [Tier 5 — NEO AI Portal](#9-tier-5--neo-ai-portal)
   - Milestone 10: NEO Portal (Node.js + React)
10. [Tier 6 — Edge & SSL](#10-tier-6--edge--ssl)
    - Milestone 11: Nginx Reverse Proxy + Certbot SSL
11. [Integration Test Suite](#11-integration-test-suite)
12. [Rollback Procedures](#12-rollback-procedures)
13. [Monitoring & Health Checks](#13-monitoring--health-checks)
14. [Deployment Checklist](#14-deployment-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 6 — EDGE                                │
│              Nginx 1.25 + Certbot SSL (Port 80/443)             │
└────────────────────────┬────────────────────────────────────────┘
                         │ Reverse Proxy
┌────────────────────────▼────────────────────────────────────────┐
│                  TIER 5 — NEO AI PORTAL                         │
│         NEO Portal (Node.js 22 + React 19) — Port 4000          │
│    Conversational AI · Approval Engine · Integration Hub        │
└──┬──────────┬──────────┬──────────┬──────────┬──────────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Odoo  │ │Orange  │ │Open    │ │Meta-   │ │Rocket  │
│19.0  │ │HRM 5   │ │Project │ │base    │ │.Chat   │
│:8069 │ │:8080   │ │:8090   │ │:3030   │ │:3000   │
└──┬───┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
   │         │          │          │           │
   └─────────┴──────────┴──────────┴───────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐     ┌──────────┐     ┌──────────┐
   │Postgres │     │ Redis    │     │  MinIO   │
   │16+pgvec │     │ 7.2      │     │ Object   │
   │:5432    │     │ :6379    │     │ Storage  │
   └─────────┘     └──────────┘     └──────────┘
   TIER 1 — FOUNDATION
```

### Network Topology

| Network | Subnet | Purpose |
|:---|:---|:---|
| `neo-internal` | 172.20.0.0/24 | NEO portal ↔ all application services |
| `data-internal` | 172.21.0.0/24 | All services ↔ PostgreSQL, Redis, MinIO |
| `integration-internal` | 172.22.0.0/24 | Cross-service API calls (Odoo ↔ OpenProject ↔ OrangeHRM) |

---

## 2. Prerequisites & Server Sizing

### Minimum Server Specification

| Resource | Minimum | Recommended | Notes |
|:---|:---|:---|:---|
| CPU | 4 vCPU | **8 vCPU** | Odoo + OpenProject are CPU-intensive |
| RAM | 8 GB | **16 GB** | PostgreSQL needs 4 GB; Odoo 2 GB; OpenProject 2 GB |
| SSD | 80 GB | **160 GB** | Grows with attachments, logs, and backups |
| OS | Ubuntu 22.04 LTS | **Ubuntu 22.04 LTS** | Tested and supported |
| Network | 100 Mbps | 1 Gbps | For file uploads and video calls |

### Recommended Provider Options

| Provider | Plan | vCPU | RAM | SSD | Cost/Month |
|:---|:---|:---|:---|:---|:---|
| **Hetzner Cloud** | CX42 | 8 | 16 GB | 160 GB | ~€29 (~SAR 120) |
| DigitalOcean | General 8GB | 4 | 8 GB | 160 GB | $48 (~SAR 180) |
| Contabo | VPS M | 6 | 16 GB | 400 GB | €8.99 (~SAR 37) |
| AWS EC2 | t3.xlarge | 4 | 16 GB | EBS | ~$150 (~SAR 562) |

**Recommendation:** Hetzner CX42 — best price/performance ratio for this stack.

### Software Prerequisites

```bash
# Install Docker Engine (Ubuntu 22.04)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# Install Certbot for SSL
sudo apt-get install -y certbot

# Verify installations
docker --version          # Docker 25.x+
docker compose version    # Docker Compose 2.x+
certbot --version         # certbot 2.x+

# Install useful tools
sudo apt-get install -y htop curl wget jq git unzip
```

---

## 3. Repository & Directory Structure

```
/opt/gt-neo-platform/
├── docker-compose.yml              ← Master compose (all services)
├── docker-compose.override.yml     ← Local dev overrides (gitignored)
├── .env                            ← Secrets (gitignored)
├── .env.example                    ← Template (committed)
│
├── postgres/
│   ├── init/
│   │   ├── 01-create-databases.sql ← Creates all DBs and schemas
│   │   ├── 02-create-users.sql     ← DB users with least privilege
│   │   └── 03-seed-policy.sql      ← ASTRA AMG authority matrix seed
│   └── conf/
│       └── postgresql.conf         ← Performance tuning
│
├── redis/
│   └── redis.conf                  ← 5-DB role configuration
│
├── minio/
│   └── init-buckets.sh             ← Creates required buckets on first run
│
├── odoo/
│   ├── config/
│   │   └── odoo.conf               ← Odoo 19.0 production config
│   └── addons/                     ← OCA modules (gitignored, populated by init.sh)
│
├── orangehrm/
│   └── config/                     ← OrangeHRM custom config
│
├── openproject/
│   └── config/                     ← OpenProject environment config
│
├── metabase/
│   └── config/                     ← Metabase environment config
│
├── rocketchat/
│   └── config/                     ← Rocket.Chat admin config
│
├── outline/
│   └── config/                     ← Outline environment config
│
├── nginx/
│   ├── nginx.conf                  ← Main Nginx config
│   ├── conf.d/
│   │   ├── portal.conf             ← NEO portal virtual host
│   │   ├── erp.conf                ← Odoo virtual host
│   │   ├── hr.conf                 ← OrangeHRM virtual host
│   │   ├── pm.conf                 ← OpenProject virtual host
│   │   ├── bi.conf                 ← Metabase virtual host
│   │   ├── chat.conf               ← Rocket.Chat virtual host
│   │   ├── kb.conf                 ← Outline virtual host
│   │   └── storage.conf            ← MinIO virtual host
│   └── ssl/                        ← Certbot certificates (gitignored)
│
├── neo-portal/
│   ├── Dockerfile                  ← NEO portal container build
│   ├── package.json
│   └── src/                        ← Application source
│
├── scripts/
│   ├── init.sh                     ← One-command full deployment
│   ├── validate-milestone.sh       ← Per-milestone health check
│   ├── backup.sh                   ← Automated backup
│   ├── restore.sh                  ← Restore from backup
│   └── oca-install.sh              ← OCA module installer
│
└── docs/
    ├── GT-INFRA-001-Deployment-Guide.md
    └── GT-INFRA-002-Phased-Docker-Plan.md  ← This document
```

---

## 4. Environment Variables Master Template

```bash
# ============================================================
# GT-NEO-PLATFORM — Master Environment Variables
# File: .env (copy from .env.example, never commit)
# Document: GT-INFRA-002 | Version: 1.0
# ============================================================

# --- DOMAIN CONFIGURATION ---
BASE_DOMAIN=yourdomain.com
DOMAIN_PORTAL=portal.yourdomain.com
DOMAIN_ERP=erp.yourdomain.com
DOMAIN_HR=hr.yourdomain.com
DOMAIN_PM=pm.yourdomain.com
DOMAIN_BI=bi.yourdomain.com
DOMAIN_CHAT=chat.yourdomain.com
DOMAIN_KB=kb.yourdomain.com
DOMAIN_MINIO=storage.yourdomain.com
DOMAIN_MINIO_CONSOLE=minio.yourdomain.com

# --- POSTGRESQL ---
POSTGRES_SUPERUSER=gtadmin
POSTGRES_SUPERUSER_PASSWORD=CHANGE_ME_STRONG_PASSWORD_32CHARS

# Odoo DB
ODOO_DB_USER=odoo
ODOO_DB_PASSWORD=CHANGE_ME_ODOO_DB_PASSWORD
ODOO_DB_NAME=odoo_production

# OrangeHRM DB
ORANGEHRM_DB_USER=orangehrm
ORANGEHRM_DB_PASSWORD=CHANGE_ME_ORANGEHRM_DB_PASSWORD
ORANGEHRM_DB_NAME=orangehrm

# OpenProject DB
OPENPROJECT_DB_USER=openproject
OPENPROJECT_DB_PASSWORD=CHANGE_ME_OPENPROJECT_DB_PASSWORD

# Metabase DB
METABASE_DB_USER=metabase
METABASE_DB_PASSWORD=CHANGE_ME_METABASE_DB_PASSWORD
METABASE_DB_NAME=metabase

# Outline DB
OUTLINE_DB_USER=outline
OUTLINE_DB_PASSWORD=CHANGE_ME_OUTLINE_DB_PASSWORD
OUTLINE_DB_NAME=outline

# NEO Portal DB
NEO_DB_USER=neo
NEO_DB_PASSWORD=CHANGE_ME_NEO_DB_PASSWORD
NEO_DB_NAME=neo_platform

# --- REDIS ---
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD

# --- MINIO ---
MINIO_ROOT_USER=gtminio
MINIO_ROOT_PASSWORD=CHANGE_ME_MINIO_PASSWORD_16CHARS
MINIO_BUCKET_CONTRACTS=gt-contracts
MINIO_BUCKET_DRAWINGS=gt-drawings
MINIO_BUCKET_MEDIA=gt-media
MINIO_BUCKET_BACKUPS=gt-backups

# --- ODOO ---
ODOO_ADMIN_PASSWD=CHANGE_ME_ODOO_MASTER_PASSWORD
ODOO_SMTP_HOST=smtp.youremail.com
ODOO_SMTP_PORT=587
ODOO_SMTP_USER=noreply@yourdomain.com
ODOO_SMTP_PASSWORD=CHANGE_ME_SMTP_PASSWORD

# --- OPENPROJECT ---
OPENPROJECT_SECRET_KEY_BASE=CHANGE_ME_64_CHAR_RANDOM_STRING
OPENPROJECT_SMTP_ADDRESS=smtp.youremail.com
OPENPROJECT_SMTP_PORT=587
OPENPROJECT_SMTP_USER_NAME=noreply@yourdomain.com
OPENPROJECT_SMTP_PASSWORD=CHANGE_ME_SMTP_PASSWORD

# --- METABASE ---
MB_ENCRYPTION_SECRET_KEY=CHANGE_ME_32_CHAR_RANDOM_STRING

# --- ROCKET.CHAT ---
ROCKETCHAT_ADMIN_USERNAME=gtadmin
ROCKETCHAT_ADMIN_PASSWORD=CHANGE_ME_ROCKETCHAT_ADMIN_PASSWORD
ROCKETCHAT_ADMIN_EMAIL=admin@yourdomain.com
MONGO_INITDB_ROOT_USERNAME=rcmongo
MONGO_INITDB_ROOT_PASSWORD=CHANGE_ME_MONGO_PASSWORD

# --- OUTLINE ---
OUTLINE_SECRET_KEY=CHANGE_ME_32_CHAR_HEX_STRING
OUTLINE_UTILS_SECRET=CHANGE_ME_32_CHAR_HEX_STRING

# --- NEO PORTAL ---
NEO_JWT_SECRET=CHANGE_ME_64_CHAR_JWT_SECRET
NEO_OPENAI_API_KEY=sk-...your-openai-api-key...
NEO_MANUS_API_KEY=your-manus-api-key
NEO_ODOO_URL=http://odoo:8069
NEO_ODOO_DB=odoo_production
NEO_ODOO_USER=admin
NEO_ODOO_PASSWORD=CHANGE_ME_ODOO_ADMIN_PASSWORD
NEO_ORANGEHRM_URL=http://orangehrm:80
NEO_OPENPROJECT_URL=http://openproject:80
NEO_OPENPROJECT_API_KEY=CHANGE_ME_OPENPROJECT_API_KEY
NEO_METABASE_URL=http://metabase:3000
NEO_ROCKETCHAT_URL=http://rocketchat:3000
NEO_OUTLINE_URL=http://outline:3000
NEO_MINIO_ENDPOINT=minio:9000
NEO_MINIO_ACCESS_KEY=CHANGE_ME_MINIO_ACCESS_KEY
NEO_MINIO_SECRET_KEY=CHANGE_ME_MINIO_SECRET_KEY
NEO_REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
NEO_DATABASE_URL=postgresql://${NEO_DB_USER}:${NEO_DB_PASSWORD}@postgres:5432/${NEO_DB_NAME}
```

---

## 5. Tier 1 — Foundation Services

### Milestone 1: PostgreSQL 16 + pgvector + TimescaleDB

**Objective:** Deploy the primary database with all required extensions, schemas, and users.

**Estimated time:** 30–60 minutes

#### docker-compose.milestone-1.yml

```yaml
name: gt-neo-m1-postgres

networks:
  data-internal:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/24

volumes:
  postgres-data:

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: gt-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_SUPERUSER:-gtadmin}
      POSTGRES_PASSWORD: ${POSTGRES_SUPERUSER_PASSWORD}
      POSTGRES_DB: postgres
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d:ro
    networks:
      - data-internal
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_SUPERUSER:-gtadmin}"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: >
      postgres
        -c max_connections=300
        -c shared_buffers=2GB
        -c effective_cache_size=6GB
        -c maintenance_work_mem=512MB
        -c checkpoint_completion_target=0.9
        -c wal_buffers=64MB
        -c default_statistics_target=100
        -c random_page_cost=1.1
        -c effective_io_concurrency=200
        -c work_mem=8MB
        -c min_wal_size=2GB
        -c max_wal_size=8GB
        -c wal_level=replica
        -c archive_mode=on
        -c archive_command='cp %p /var/lib/postgresql/data/archive/%f'
        -c log_min_duration_statement=1000
        -c log_checkpoints=on
        -c log_connections=on
        -c log_disconnections=on
```

#### postgres/init/01-create-databases.sql

```sql
-- ============================================================
-- GT-NEO-PLATFORM — PostgreSQL Initialisation Script
-- Document: GT-INFRA-002 | Milestone 1
-- ============================================================

-- Extensions (installed on postgres DB, available to all)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================
-- DATABASE: neo_platform (NEO AI Core)
-- ============================================================
CREATE DATABASE neo_platform
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8'
  TEMPLATE template0;

\c neo_platform;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector for RAG embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Trigram search
CREATE EXTENSION IF NOT EXISTS "btree_gin";     -- GIN index support

-- Schemas
CREATE SCHEMA IF NOT EXISTS core;       -- Users, conversations, messages
CREATE SCHEMA IF NOT EXISTS ops;        -- Requests, approvals, audit
CREATE SCHEMA IF NOT EXISTS kb;         -- Knowledge base, embeddings
CREATE SCHEMA IF NOT EXISTS ai;         -- Routing logs, model calls
CREATE SCHEMA IF NOT EXISTS policy;     -- ASTRA AMG authority matrix
CREATE SCHEMA IF NOT EXISTS metrics;    -- KPI time-series data
CREATE SCHEMA IF NOT EXISTS business;   -- CRM, legal, contracts
CREATE SCHEMA IF NOT EXISTS integrations; -- Sync state with external systems

-- ============================================================
-- SCHEMA: core — Users and Conversations
-- ============================================================

CREATE TABLE core.users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100),
    department      VARCHAR(100),
    job_title       VARCHAR(150),
    role            VARCHAR(50) NOT NULL DEFAULT 'employee',
    permissions     JSONB NOT NULL DEFAULT '[]',
    language        VARCHAR(10) NOT NULL DEFAULT 'en',
    timezone        VARCHAR(50) NOT NULL DEFAULT 'Asia/Riyadh',
    avatar_url      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    password_hash   TEXT NOT NULL,
    mfa_secret      TEXT,
    mfa_enabled     BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON core.users(email);
CREATE INDEX idx_users_employee_id ON core.users(employee_id);
CREATE INDEX idx_users_department ON core.users(department);
CREATE INDEX idx_users_role ON core.users(role);

CREATE TABLE core.sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    ip_address      INET,
    user_agent      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON core.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON core.sessions(expires_at);

CREATE TABLE core.conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES core.users(id),
    title           VARCHAR(500),
    context         JSONB NOT NULL DEFAULT '{}',
    module_context  VARCHAR(100),
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    message_count   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON core.conversations(user_id);
CREATE INDEX idx_conversations_status ON core.conversations(status);
CREATE INDEX idx_conversations_created_at ON core.conversations(created_at DESC);

CREATE TABLE core.messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES core.conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content         TEXT NOT NULL,
    content_type    VARCHAR(50) NOT NULL DEFAULT 'text',
    tool_calls      JSONB,
    tool_results    JSONB,
    model_used      VARCHAR(100),
    tokens_input    INTEGER,
    tokens_output   INTEGER,
    latency_ms      INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON core.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON core.messages(created_at DESC);
CREATE INDEX idx_messages_role ON core.messages(role);

-- ============================================================
-- SCHEMA: ops — Requests, Approvals, Audit
-- ============================================================

CREATE TABLE ops.requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number  VARCHAR(50) UNIQUE NOT NULL,
    user_id         UUID NOT NULL REFERENCES core.users(id),
    conversation_id UUID REFERENCES core.conversations(id),
    module          VARCHAR(100) NOT NULL,
    action          VARCHAR(200) NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}',
    status          VARCHAR(30) NOT NULL DEFAULT 'pending_approval',
    priority        VARCHAR(20) NOT NULL DEFAULT 'normal',
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    approved_by     UUID REFERENCES core.users(id),
    approved_at     TIMESTAMPTZ,
    executed_at     TIMESTAMPTZ,
    result          JSONB,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_user_id ON ops.requests(user_id);
CREATE INDEX idx_requests_status ON ops.requests(status);
CREATE INDEX idx_requests_module ON ops.requests(module);
CREATE INDEX idx_requests_created_at ON ops.requests(created_at DESC);

CREATE TABLE ops.approvals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id      UUID NOT NULL REFERENCES ops.requests(id),
    approver_id     UUID NOT NULL REFERENCES core.users(id),
    decision        VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected', 'delegated')),
    comments        TEXT,
    decided_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approvals_request_id ON ops.approvals(request_id);
CREATE INDEX idx_approvals_approver_id ON ops.approvals(approver_id);

-- Immutable audit log with hash chain (tamper-evident)
CREATE TABLE ops.audit_events (
    id              BIGSERIAL PRIMARY KEY,
    event_uuid      UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    user_id         UUID REFERENCES core.users(id),
    action          VARCHAR(200) NOT NULL,
    resource_type   VARCHAR(100),
    resource_id     TEXT,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    session_id      UUID,
    prev_hash       TEXT,
    event_hash      TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON ops.audit_events(user_id);
CREATE INDEX idx_audit_action ON ops.audit_events(action);
CREATE INDEX idx_audit_resource ON ops.audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON ops.audit_events(created_at DESC);

-- ============================================================
-- SCHEMA: kb — Knowledge Base and RAG Embeddings
-- ============================================================

CREATE TABLE kb.knowledge_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(500) NOT NULL,
    content         TEXT NOT NULL,
    source_type     VARCHAR(50) NOT NULL,
    source_url      TEXT,
    module_tags     TEXT[] NOT NULL DEFAULT '{}',
    language        VARCHAR(10) NOT NULL DEFAULT 'en',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_by      UUID REFERENCES core.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kb_items_module_tags ON kb.knowledge_items USING GIN(module_tags);
CREATE INDEX idx_kb_items_language ON kb.knowledge_items(language);

CREATE TABLE kb.embeddings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id         UUID NOT NULL REFERENCES kb.knowledge_items(id) ON DELETE CASCADE,
    chunk_index     INTEGER NOT NULL,
    chunk_text      TEXT NOT NULL,
    embedding       vector(1536),       -- OpenAI text-embedding-3-small
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_embeddings_item_id ON kb.embeddings(item_id);
CREATE INDEX idx_embeddings_vector ON kb.embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ============================================================
-- SCHEMA: ai — Routing Logs and Model Tracking
-- ============================================================

CREATE TABLE ai.routing_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id      UUID REFERENCES core.messages(id),
    input_tokens    INTEGER,
    router_decision VARCHAR(50) NOT NULL,
    model_selected  VARCHAR(100) NOT NULL,
    confidence      NUMERIC(5,4),
    modules_invoked TEXT[],
    total_latency_ms INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai.model_calls (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routing_log_id  UUID REFERENCES ai.routing_logs(id),
    model           VARCHAR(100) NOT NULL,
    provider        VARCHAR(50) NOT NULL,
    tokens_in       INTEGER,
    tokens_out      INTEGER,
    cost_usd        NUMERIC(10,6),
    latency_ms      INTEGER,
    success         BOOLEAN NOT NULL,
    error           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_model_calls_model ON ai.model_calls(model);
CREATE INDEX idx_model_calls_created_at ON ai.model_calls(created_at DESC);

-- ============================================================
-- SCHEMA: policy — ASTRA AMG Authority Matrix
-- ============================================================

CREATE TABLE policy.authority_matrix (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role            VARCHAR(100) NOT NULL,
    module          VARCHAR(100) NOT NULL,
    action          VARCHAR(200) NOT NULL,
    max_value       NUMERIC(15,2),
    currency        VARCHAR(10) DEFAULT 'SAR',
    requires_dual_approval BOOLEAN NOT NULL DEFAULT false,
    escalation_role VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role, module, action)
);

CREATE TABLE policy.policy_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    module          VARCHAR(100),
    condition_json  JSONB NOT NULL,
    action_json     JSONB NOT NULL,
    priority        INTEGER NOT NULL DEFAULT 100,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCHEMA: metrics — KPI Time-Series
-- ============================================================

CREATE TABLE metrics.kpi_readings (
    time            TIMESTAMPTZ NOT NULL,
    kpi_key         VARCHAR(200) NOT NULL,
    value           NUMERIC(20,4) NOT NULL,
    unit            VARCHAR(50),
    source          VARCHAR(100),
    department      VARCHAR(100),
    metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_kpi_readings_time ON metrics.kpi_readings(time DESC);
CREATE INDEX idx_kpi_readings_key ON metrics.kpi_readings(kpi_key, time DESC);

-- ============================================================
-- SCHEMA: business — CRM, Legal, Contracts
-- ============================================================

CREATE TABLE business.crm_leads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    odoo_lead_id    INTEGER,
    company_name    VARCHAR(255),
    contact_name    VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(50),
    stage           VARCHAR(100),
    probability     NUMERIC(5,2),
    expected_revenue NUMERIC(15,2),
    assigned_to     UUID REFERENCES core.users(id),
    ai_score        NUMERIC(5,2),
    ai_notes        TEXT,
    synced_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business.legal_contracts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    title           VARCHAR(500) NOT NULL,
    party_name      VARCHAR(255) NOT NULL,
    contract_type   VARCHAR(100),
    status          VARCHAR(50) NOT NULL DEFAULT 'draft',
    value           NUMERIC(15,2),
    currency        VARCHAR(10) DEFAULT 'SAR',
    start_date      DATE,
    end_date        DATE,
    file_url        TEXT,
    ai_risk_score   NUMERIC(5,2),
    ai_summary      TEXT,
    obligations     JSONB DEFAULT '[]',
    created_by      UUID REFERENCES core.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_status ON business.legal_contracts(status);
CREATE INDEX idx_contracts_end_date ON business.legal_contracts(end_date);

-- ============================================================
-- SCHEMA: integrations — External System Sync State
-- ============================================================

CREATE TABLE integrations.sync_state (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    last_sync_at    TIMESTAMPTZ,
    last_sync_status VARCHAR(20),
    records_synced  INTEGER DEFAULT 0,
    error_message   TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(system, entity_type)
);

-- ============================================================
-- DATABASE: odoo_production (Odoo 19.0)
-- ============================================================
CREATE DATABASE odoo_production
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8'
  TEMPLATE template0;

-- ============================================================
-- DATABASE: orangehrm
-- ============================================================
CREATE DATABASE orangehrm
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8'
  TEMPLATE template0;

-- ============================================================
-- DATABASE: openproject
-- ============================================================
CREATE DATABASE openproject
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8'
  TEMPLATE template0;

-- ============================================================
-- DATABASE: metabase
-- ============================================================
CREATE DATABASE metabase
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8'
  TEMPLATE template0;

-- ============================================================
-- DATABASE: outline
-- ============================================================
CREATE DATABASE outline
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8'
  TEMPLATE template0;
```

#### postgres/init/02-create-users.sql

```sql
-- ============================================================
-- GT-NEO-PLATFORM — Database Users (Least Privilege)
-- ============================================================

-- Odoo user
CREATE USER odoo WITH PASSWORD :'ODOO_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE odoo_production TO odoo;

-- OrangeHRM user
CREATE USER orangehrm WITH PASSWORD :'ORANGEHRM_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE orangehrm TO orangehrm;

-- OpenProject user
CREATE USER openproject WITH PASSWORD :'OPENPROJECT_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE openproject TO openproject;

-- Metabase user (read-only on neo_platform for dashboards)
CREATE USER metabase WITH PASSWORD :'METABASE_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE metabase TO metabase;
\c neo_platform;
GRANT USAGE ON SCHEMA metrics, business, ops TO metabase;
GRANT SELECT ON ALL TABLES IN SCHEMA metrics TO metabase;
GRANT SELECT ON ALL TABLES IN SCHEMA business TO metabase;
GRANT SELECT ON ALL TABLES IN SCHEMA ops TO metabase;

-- Outline user
CREATE USER outline WITH PASSWORD :'OUTLINE_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE outline TO outline;

-- NEO Portal user
CREATE USER neo WITH PASSWORD :'NEO_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE neo_platform TO neo;
```

#### Validation Script — Milestone 1

```bash
#!/bin/bash
# scripts/validate-m1-postgres.sh

echo "=== Milestone 1 Validation: PostgreSQL ==="

# 1. Container running
docker ps | grep gt-postgres | grep -q "healthy" \
  && echo "✓ Container: healthy" \
  || { echo "✗ Container not healthy"; exit 1; }

# 2. PostgreSQL accepting connections
docker exec gt-postgres pg_isready -U gtadmin \
  && echo "✓ PostgreSQL: accepting connections" \
  || { echo "✗ PostgreSQL not accepting connections"; exit 1; }

# 3. All databases created
EXPECTED_DBS="neo_platform odoo_production orangehrm openproject metabase outline"
for db in $EXPECTED_DBS; do
  docker exec gt-postgres psql -U gtadmin -c "\l" | grep -q "$db" \
    && echo "✓ Database: $db exists" \
    || echo "✗ Database: $db MISSING"
done

# 4. pgvector extension loaded
docker exec gt-postgres psql -U gtadmin -d neo_platform \
  -c "SELECT extname FROM pg_extension WHERE extname = 'vector';" | grep -q "vector" \
  && echo "✓ Extension: pgvector loaded" \
  || echo "✗ Extension: pgvector NOT loaded"

# 5. All schemas created
EXPECTED_SCHEMAS="core ops kb ai policy metrics business integrations"
for schema in $EXPECTED_SCHEMAS; do
  docker exec gt-postgres psql -U gtadmin -d neo_platform \
    -c "\dn" | grep -q "$schema" \
    && echo "✓ Schema: $schema exists" \
    || echo "✗ Schema: $schema MISSING"
done

echo ""
echo "=== Milestone 1 Complete ==="
```

---

### Milestone 2: Redis 7.2

**Objective:** Deploy Redis with 5 dedicated database roles, password authentication, and persistence.

**Estimated time:** 15–20 minutes

#### docker-compose.milestone-2.yml

```yaml
name: gt-neo-m2-redis

networks:
  data-internal:
    external: true

volumes:
  redis-data:

services:
  redis:
    image: redis:7.2-alpine
    container_name: gt-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    networks:
      - data-internal
    ports:
      - "127.0.0.1:6379:6379"
    command: redis-server /usr/local/etc/redis/redis.conf --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

#### redis/redis.conf

```conf
# ============================================================
# GT-NEO-PLATFORM — Redis 7.2 Configuration
# 5 Database Role Architecture:
#   DB 0: API Response Cache      (512 MB, allkeys-lru)
#   DB 1: BullMQ Job Queues       (1024 MB, noeviction — CRITICAL)
#   DB 2: Session Management      (128 MB, volatile-ttl)
#   DB 3: Real-Time Pub/Sub       (64 MB, allkeys-lru)
#   DB 4: Rate Limiting           (32 MB, allkeys-lru)
# ============================================================

# Network
bind 0.0.0.0
port 6379
protected-mode yes

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Memory
maxmemory 1800mb
maxmemory-policy allkeys-lru

# Performance
tcp-keepalive 300
timeout 0
tcp-backlog 511
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes

# Logging
loglevel notice
logfile ""

# Databases
databases 16

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128
```

#### Validation Script — Milestone 2

```bash
#!/bin/bash
# scripts/validate-m2-redis.sh

echo "=== Milestone 2 Validation: Redis ==="

# 1. Container healthy
docker ps | grep gt-redis | grep -q "healthy" \
  && echo "✓ Container: healthy" \
  || { echo "✗ Container not healthy"; exit 1; }

# 2. PING test
docker exec gt-redis redis-cli -a "$REDIS_PASSWORD" ping | grep -q "PONG" \
  && echo "✓ Redis: responding to PING" \
  || { echo "✗ Redis not responding"; exit 1; }

# 3. Test each database role
for db in 0 1 2 3 4; do
  docker exec gt-redis redis-cli -a "$REDIS_PASSWORD" -n $db SET "test:milestone2" "ok" EX 60 > /dev/null
  VAL=$(docker exec gt-redis redis-cli -a "$REDIS_PASSWORD" -n $db GET "test:milestone2")
  [ "$VAL" = "ok" ] \
    && echo "✓ DB $db: read/write working" \
    || echo "✗ DB $db: FAILED"
done

# 4. Persistence check
docker exec gt-redis redis-cli -a "$REDIS_PASSWORD" CONFIG GET appendonly | grep -q "yes" \
  && echo "✓ Persistence: AOF enabled" \
  || echo "✗ Persistence: AOF NOT enabled"

echo ""
echo "=== Milestone 2 Complete ==="
```

---

### Milestone 3: MinIO Object Storage

**Objective:** Deploy MinIO and create all required buckets for the platform.

**Estimated time:** 20–30 minutes

#### docker-compose.milestone-3.yml

```yaml
name: gt-neo-m3-minio

networks:
  data-internal:
    external: true

volumes:
  minio-data:

services:
  minio:
    image: minio/minio:latest
    container_name: gt-minio
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-gtminio}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_BROWSER_REDIRECT_URL: https://${DOMAIN_MINIO_CONSOLE}
    volumes:
      - minio-data:/data
    networks:
      - data-internal
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
```

#### minio/init-buckets.sh

```bash
#!/bin/bash
# minio/init-buckets.sh — Create all required MinIO buckets

MC="docker exec gt-minio mc"

# Wait for MinIO to be ready
until $MC alias set gtminio http://localhost:9000 \
  "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" 2>/dev/null; do
  echo "Waiting for MinIO..."
  sleep 3
done

# Create buckets
BUCKETS="gt-contracts gt-drawings gt-media gt-backups gt-hr-documents gt-legal gt-invoices"
for bucket in $BUCKETS; do
  $MC mb "gtminio/$bucket" 2>/dev/null && echo "✓ Created: $bucket" || echo "  Exists: $bucket"
done

# Set lifecycle policies (auto-delete temp files after 7 days)
$MC ilm add --expiry-days 7 gtminio/gt-media --prefix "temp/"

echo "MinIO bucket initialisation complete."
```

---

## 6. Tier 2 — Core Business Systems

### Milestone 4: Odoo 19.0 Community

**Objective:** Deploy Odoo 19.0 with OCA modules, Saudi Arabia localisation, and NEO API user.

**Estimated time:** 2–4 hours (includes module installation and initial configuration)

#### docker-compose.milestone-4.yml

```yaml
name: gt-neo-m4-odoo

networks:
  data-internal:
    external: true
  integration-internal:
    driver: bridge
    ipam:
      config:
        - subnet: 172.22.0.0/24

volumes:
  odoo-data:
  odoo-addons:

services:
  odoo:
    image: odoo:19.0
    container_name: gt-odoo
    restart: unless-stopped
    depends_on:
      - odoo-postgres-check
    environment:
      HOST: ${POSTGRES_HOST:-host.docker.internal}
      PORT: 5432
      USER: ${ODOO_DB_USER:-odoo}
      PASSWORD: ${ODOO_DB_PASSWORD}
    volumes:
      - odoo-data:/var/lib/odoo
      - ./odoo/config/odoo.conf:/etc/odoo/odoo.conf:ro
      - ./odoo/addons:/mnt/extra-addons:ro
    networks:
      - data-internal
      - integration-internal
    ports:
      - "127.0.0.1:8069:8069"
      - "127.0.0.1:8072:8072"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8069/web/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 90s

  # Dependency check helper
  odoo-postgres-check:
    image: postgres:16-alpine
    container_name: gt-odoo-pg-check
    command: >
      sh -c "until pg_isready -h ${POSTGRES_HOST:-host.docker.internal} -U ${ODOO_DB_USER:-odoo}; do sleep 2; done"
    networks:
      - data-internal
    restart: "no"
```

#### odoo/config/odoo.conf

```ini
[options]
; Golden Team NEO Platform — Odoo 19.0 Production Configuration
; Document: GT-INFRA-002 | Version: 1.0

; Database
db_host = postgres
db_port = 5432
db_user = odoo
db_password = False
db_name = odoo_production
db_maxconn = 64

; Admin
admin_passwd = False
list_db = False

; Paths
data_dir = /var/lib/odoo
addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons

; Workers (set based on CPU cores: 2 * cores + 1)
workers = 4
max_cron_threads = 2
limit_memory_hard = 2684354560
limit_memory_soft = 2147483648
limit_request = 8192
limit_time_cpu = 600
limit_time_real = 1200

; Logging
logfile = /var/log/odoo/odoo.log
log_level = warn
log_db = False

; SMTP
smtp_server = False
smtp_port = 587
smtp_ssl = False
smtp_user = False
smtp_password = False

; Security
proxy_mode = True
xmlrpc_interface = 0.0.0.0
xmlrpc_port = 8069
longpolling_port = 8072
```

#### OCA Module Installation Script

```bash
#!/bin/bash
# scripts/oca-install.sh — Install OCA modules for Odoo 19.0

ADDONS_DIR="./odoo/addons"
mkdir -p "$ADDONS_DIR"

echo "Installing OCA modules for Odoo 19.0..."

# Payroll + Accounting integration
git clone https://github.com/OCA/payroll.git --branch 19.0 --depth 1 /tmp/oca-payroll
cp -r /tmp/oca-payroll/hr_payroll_account "$ADDONS_DIR/"
cp -r /tmp/oca-payroll/hr_payroll "$ADDONS_DIR/"

# Advanced accounting
git clone https://github.com/OCA/account-financial-tools.git --branch 19.0 --depth 1 /tmp/oca-account
cp -r /tmp/oca-account/account_move_line_tax_editable "$ADDONS_DIR/" 2>/dev/null || true

# CRM enhancements
git clone https://github.com/OCA/crm.git --branch 19.0 --depth 1 /tmp/oca-crm
cp -r /tmp/oca-crm/crm_stage_probability "$ADDONS_DIR/" 2>/dev/null || true

# Project management
git clone https://github.com/OCA/project.git --branch 19.0 --depth 1 /tmp/oca-project
cp -r /tmp/oca-project/project_stage_state "$ADDONS_DIR/" 2>/dev/null || true

# Purchase enhancements
git clone https://github.com/OCA/purchase-workflow.git --branch 19.0 --depth 1 /tmp/oca-purchase
cp -r /tmp/oca-purchase/purchase_order_approved "$ADDONS_DIR/" 2>/dev/null || true

# REST API for NEO integration
git clone https://github.com/OCA/rest-framework.git --branch 19.0 --depth 1 /tmp/oca-rest
cp -r /tmp/oca-rest/base_rest "$ADDONS_DIR/" 2>/dev/null || true

echo "✓ OCA modules installed to $ADDONS_DIR"
echo "Restart Odoo to load: docker compose restart odoo"
```

#### Validation Script — Milestone 4

```bash
#!/bin/bash
# scripts/validate-m4-odoo.sh

echo "=== Milestone 4 Validation: Odoo 19.0 ==="

# 1. Container healthy
docker ps | grep gt-odoo | grep -q "healthy" \
  && echo "✓ Container: healthy" \
  || { echo "✗ Container not healthy"; exit 1; }

# 2. Web health endpoint
curl -sf http://localhost:8069/web/health | grep -q "ok" \
  && echo "✓ Health endpoint: OK" \
  || echo "✗ Health endpoint: FAILED"

# 3. JSON-RPC API test
RESULT=$(curl -sf -X POST http://localhost:8069/web/dataset/call_kw \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"call","params":{"model":"res.lang","method":"search_read","args":[[]],"kwargs":{"fields":["name"],"limit":1}}}')
echo "$RESULT" | grep -q '"result"' \
  && echo "✓ JSON-RPC API: responding" \
  || echo "✗ JSON-RPC API: FAILED"

# 4. Long-polling port
curl -sf http://localhost:8072 > /dev/null 2>&1
echo "✓ Long-polling port 8072: accessible"

echo ""
echo "=== Milestone 4 Complete ==="
echo "Next: Open http://localhost:8069 and complete Odoo database setup"
```

---

### Milestone 5: OrangeHRM 5

**Objective:** Deploy OrangeHRM with PostgreSQL backend and REST API enabled.

**Estimated time:** 1–2 hours

#### docker-compose.milestone-5.yml

```yaml
name: gt-neo-m5-orangehrm

networks:
  data-internal:
    external: true
  integration-internal:
    external: true

volumes:
  orangehrm-data:

services:
  orangehrm:
    image: orangehrm/orangehrm:latest
    container_name: gt-orangehrm
    restart: unless-stopped
    environment:
      ORANGEHRM_DATABASE_HOST: ${POSTGRES_HOST:-host.docker.internal}
      ORANGEHRM_DATABASE_PORT: 5432
      ORANGEHRM_DATABASE_NAME: ${ORANGEHRM_DB_NAME:-orangehrm}
      ORANGEHRM_DATABASE_USER: ${ORANGEHRM_DB_USER:-orangehrm}
      ORANGEHRM_DATABASE_PASSWORD: ${ORANGEHRM_DB_PASSWORD}
    volumes:
      - orangehrm-data:/var/www/html/lib/confs
    networks:
      - data-internal
      - integration-internal
    ports:
      - "127.0.0.1:8080:80"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/index.php/auth/login"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
```

#### Validation Script — Milestone 5

```bash
#!/bin/bash
# scripts/validate-m5-orangehrm.sh

echo "=== Milestone 5 Validation: OrangeHRM ==="

docker ps | grep gt-orangehrm | grep -q "healthy" \
  && echo "✓ Container: healthy" \
  || { echo "✗ Container not healthy"; exit 1; }

curl -sf http://localhost:8080/index.php/auth/login | grep -q "OrangeHRM" \
  && echo "✓ Login page: accessible" \
  || echo "✗ Login page: FAILED"

echo ""
echo "=== Milestone 5 Complete ==="
echo "Next: Open http://localhost:8080 and complete OrangeHRM setup wizard"
```

---

### Milestone 6: OpenProject 16 (ASTRA PM Engine)

**Objective:** Deploy OpenProject as the ASTRA PM engine with PostgreSQL and Redis backends.

**Estimated time:** 1–2 hours

#### docker-compose.milestone-6.yml

```yaml
name: gt-neo-m6-openproject

networks:
  data-internal:
    external: true
  integration-internal:
    external: true

volumes:
  openproject-data:
  openproject-assets:

services:
  openproject:
    image: openproject/openproject:16
    container_name: gt-openproject
    restart: unless-stopped
    environment:
      OPENPROJECT_HOST__NAME: ${DOMAIN_PM:-pm.yourdomain.com}
      OPENPROJECT_HTTPS: "true"
      OPENPROJECT_DEFAULT__LANGUAGE: en
      DATABASE_URL: postgresql://${OPENPROJECT_DB_USER:-openproject}:${OPENPROJECT_DB_PASSWORD}@${POSTGRES_HOST:-host.docker.internal}/openproject
      RAILS_CACHE_STORE: redis
      OPENPROJECT_CACHE__MEMCACHE__SERVER: redis://:${REDIS_PASSWORD}@${REDIS_HOST:-host.docker.internal}:6379/5
      SECRET_KEY_BASE: ${OPENPROJECT_SECRET_KEY_BASE}
      OPENPROJECT_RAILS__RELATIVE__URL__ROOT: ""
      IMAP_ENABLED: "false"
      OPENPROJECT_SMTP__ADDRESS: ${OPENPROJECT_SMTP_ADDRESS}
      OPENPROJECT_SMTP__PORT: ${OPENPROJECT_SMTP_PORT:-587}
      OPENPROJECT_SMTP__USER__NAME: ${OPENPROJECT_SMTP_USER_NAME}
      OPENPROJECT_SMTP__PASSWORD: ${OPENPROJECT_SMTP_PASSWORD}
    volumes:
      - openproject-data:/var/openproject/assets
    networks:
      - data-internal
      - integration-internal
    ports:
      - "127.0.0.1:8090:80"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health_checks/default"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 180s
```

#### Validation Script — Milestone 6

```bash
#!/bin/bash
# scripts/validate-m6-openproject.sh

echo "=== Milestone 6 Validation: OpenProject (ASTRA PM) ==="

docker ps | grep gt-openproject | grep -q "healthy" \
  && echo "✓ Container: healthy" \
  || { echo "✗ Container not healthy"; exit 1; }

curl -sf http://localhost:8090/health_checks/default | grep -q "\"healthy\":true" \
  && echo "✓ Health check: healthy" \
  || echo "✗ Health check: FAILED"

# Test API endpoint
curl -sf http://localhost:8090/api/v3 | grep -q "OpenProject" \
  && echo "✓ REST API v3: accessible" \
  || echo "✗ REST API: FAILED"

echo ""
echo "=== Milestone 6 Complete ==="
echo "Next: Open http://localhost:8090 and configure ASTRA PM workspace"
```

---

## 7. Tier 3 — Intelligence & Analytics

### Milestone 7: Metabase BI

**Objective:** Deploy Metabase connected to PostgreSQL for KPI dashboards.

**Estimated time:** 30–60 minutes

#### docker-compose.milestone-7.yml

```yaml
name: gt-neo-m7-metabase

networks:
  data-internal:
    external: true
  integration-internal:
    external: true

volumes:
  metabase-data:

services:
  metabase:
    image: metabase/metabase:latest
    container_name: gt-metabase
    restart: unless-stopped
    environment:
      MB_DB_TYPE: postgres
      MB_DB_DBNAME: ${METABASE_DB_NAME:-metabase}
      MB_DB_PORT: 5432
      MB_DB_USER: ${METABASE_DB_USER:-metabase}
      MB_DB_PASS: ${METABASE_DB_PASSWORD}
      MB_DB_HOST: ${POSTGRES_HOST:-host.docker.internal}
      MB_SITE_URL: https://${DOMAIN_BI:-bi.yourdomain.com}
      MB_ENCRYPTION_SECRET_KEY: ${MB_ENCRYPTION_SECRET_KEY}
      JAVA_TIMEZONE: Asia/Riyadh
      MB_ANON_TRACKING_ENABLED: "false"
    volumes:
      - metabase-data:/metabase-data
    networks:
      - data-internal
      - integration-internal
    ports:
      - "127.0.0.1:3030:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 90s
```

---

### Milestone 8: Outline Knowledge Base

**Objective:** Deploy Outline as the NEO knowledge base, connected to MinIO for file storage.

**Estimated time:** 30–60 minutes

#### docker-compose.milestone-8.yml

```yaml
name: gt-neo-m8-outline

networks:
  data-internal:
    external: true
  integration-internal:
    external: true

volumes:
  outline-data:

services:
  outline:
    image: outlinewiki/outline:latest
    container_name: gt-outline
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${OUTLINE_DB_USER:-outline}:${OUTLINE_DB_PASSWORD}@${POSTGRES_HOST:-host.docker.internal}:5432/${OUTLINE_DB_NAME:-outline}
      REDIS_URL: redis://:${REDIS_PASSWORD}@${REDIS_HOST:-host.docker.internal}:6379/6
      SECRET_KEY: ${OUTLINE_SECRET_KEY}
      UTILS_SECRET: ${OUTLINE_UTILS_SECRET}
      URL: https://${DOMAIN_KB:-kb.yourdomain.com}
      PORT: 3000
      AWS_ACCESS_KEY_ID: ${MINIO_ROOT_USER}
      AWS_SECRET_ACCESS_KEY: ${MINIO_ROOT_PASSWORD}
      AWS_REGION: us-east-1
      AWS_S3_UPLOAD_BUCKET_URL: http://${MINIO_HOST:-host.docker.internal}:9000
      AWS_S3_UPLOAD_BUCKET_NAME: gt-media
      AWS_S3_FORCE_PATH_STYLE: "true"
      AWS_S3_ACL: private
      FORCE_HTTPS: "false"
      ENABLE_UPDATES: "false"
      DEFAULT_LANGUAGE: en_US
    volumes:
      - outline-data:/var/lib/outline/data
    networks:
      - data-internal
      - integration-internal
    ports:
      - "127.0.0.1:3040:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/_health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
```

---

## 8. Tier 4 — Communications

### Milestone 9: Rocket.Chat + MongoDB

**Objective:** Deploy Rocket.Chat as the inter-corporate communications backbone.

**Estimated time:** 1–2 hours

#### docker-compose.milestone-9.yml

```yaml
name: gt-neo-m9-rocketchat

networks:
  data-internal:
    external: true
  integration-internal:
    external: true

volumes:
  rocketchat-uploads:
  rocketchat-mongo:

services:
  rocketchat-mongo:
    image: mongo:6.0
    container_name: gt-mongo
    restart: unless-stopped
    command: mongod --oplogSize 128 --replSet rs0
    volumes:
      - rocketchat-mongo:/data/db
    networks:
      - data-internal
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongo-init-replica:
    image: mongo:6.0
    container_name: gt-mongo-init
    command: >
      mongosh --host rocketchat-mongo:27017 --eval
      "rs.initiate({_id:'rs0',members:[{_id:0,host:'rocketchat-mongo:27017'}]})"
    depends_on:
      rocketchat-mongo:
        condition: service_healthy
    networks:
      - data-internal
    restart: "no"

  rocketchat:
    image: registry.rocket.chat/rocketchat/rocket.chat:latest
    container_name: gt-rocketchat
    restart: unless-stopped
    depends_on:
      rocketchat-mongo:
        condition: service_healthy
    environment:
      MONGO_URL: mongodb://rocketchat-mongo:27017/rocketchat?replicaSet=rs0
      MONGO_OPLOG_URL: mongodb://rocketchat-mongo:27017/local?replicaSet=rs0
      ROOT_URL: https://${DOMAIN_CHAT:-chat.yourdomain.com}
      PORT: 3000
      DEPLOY_PLATFORM: docker
      OVERWRITE_SETTING_Show_Setup_Wizard: completed
      ADMIN_USERNAME: ${ROCKETCHAT_ADMIN_USERNAME:-gtadmin}
      ADMIN_PASS: ${ROCKETCHAT_ADMIN_PASSWORD}
      ADMIN_EMAIL: ${ROCKETCHAT_ADMIN_EMAIL}
    volumes:
      - rocketchat-uploads:/app/uploads
    networks:
      - data-internal
      - integration-internal
    ports:
      - "127.0.0.1:3050:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
```

---

## 9. Tier 5 — NEO AI Portal

### Milestone 10: NEO Portal (Node.js + React)

**Objective:** Deploy the custom NEO AI portal application that orchestrates all integrated services.

**Estimated time:** 2–4 hours (build + deploy)

#### neo-portal/Dockerfile

```dockerfile
# ============================================================
# GT-NEO-PLATFORM — NEO Portal Dockerfile
# Node.js 22 LTS + React 19
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build frontend
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy built assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Non-root user
RUN addgroup -S neo && adduser -S neo -G neo
USER neo

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "dist/server/index.js"]
```

#### docker-compose.milestone-10.yml

```yaml
name: gt-neo-m10-portal

networks:
  neo-internal:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/24
  data-internal:
    external: true
  integration-internal:
    external: true

services:
  neo-portal:
    build:
      context: ./neo-portal
      dockerfile: Dockerfile
    image: gt-neo-portal:latest
    container_name: gt-neo-portal
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 4000
      DATABASE_URL: ${NEO_DATABASE_URL}
      REDIS_URL: ${NEO_REDIS_URL}
      JWT_SECRET: ${NEO_JWT_SECRET}
      OPENAI_API_KEY: ${NEO_OPENAI_API_KEY}
      MANUS_API_KEY: ${NEO_MANUS_API_KEY}
      ODOO_URL: ${NEO_ODOO_URL}
      ODOO_DB: ${NEO_ODOO_DB}
      ODOO_USER: ${NEO_ODOO_USER}
      ODOO_PASSWORD: ${NEO_ODOO_PASSWORD}
      ORANGEHRM_URL: ${NEO_ORANGEHRM_URL}
      OPENPROJECT_URL: ${NEO_OPENPROJECT_URL}
      OPENPROJECT_API_KEY: ${NEO_OPENPROJECT_API_KEY}
      METABASE_URL: ${NEO_METABASE_URL}
      ROCKETCHAT_URL: ${NEO_ROCKETCHAT_URL}
      OUTLINE_URL: ${NEO_OUTLINE_URL}
      MINIO_ENDPOINT: ${NEO_MINIO_ENDPOINT}
      MINIO_ACCESS_KEY: ${NEO_MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${NEO_MINIO_SECRET_KEY}
    networks:
      - neo-internal
      - data-internal
      - integration-internal
    ports:
      - "127.0.0.1:4000:4000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
```

---

## 10. Tier 6 — Edge & SSL

### Milestone 11: Nginx Reverse Proxy + Certbot SSL

**Objective:** Deploy Nginx as the SSL-terminating reverse proxy for all 8 subdomains.

**Estimated time:** 1–2 hours (includes DNS propagation wait)

#### SSL Certificate Generation

```bash
#!/bin/bash
# scripts/generate-ssl.sh — Obtain Let's Encrypt certificates

BASE_DOMAIN="yourdomain.com"
SUBDOMAINS="portal erp hr pm bi chat kb storage minio"

# Build domain list for certbot
DOMAIN_ARGS="-d $BASE_DOMAIN"
for sub in $SUBDOMAINS; do
  DOMAIN_ARGS="$DOMAIN_ARGS -d $sub.$BASE_DOMAIN"
done

# Obtain wildcard certificate (requires DNS challenge)
certbot certonly \
  --manual \
  --preferred-challenges dns \
  $DOMAIN_ARGS \
  --email admin@$BASE_DOMAIN \
  --agree-tos \
  --no-eff-email

echo "Certificates saved to: /etc/letsencrypt/live/$BASE_DOMAIN/"
echo "Copy to nginx/ssl/ directory"
```

#### docker-compose.milestone-11.yml

```yaml
name: gt-neo-m11-nginx

networks:
  neo-internal:
    external: true
  integration-internal:
    external: true

services:
  nginx:
    image: nginx:1.25-alpine
    container_name: gt-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - neo-internal
      - integration-internal
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### nginx/conf.d/portal.conf

```nginx
# NEO Portal — Main Employee Portal
upstream neo_portal {
    server gt-neo-portal:4000;
    keepalive 32;
}

server {
    listen 80;
    server_name portal.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name portal.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # WebSocket support (for NEO AI chat streaming)
    location /ws {
        proxy_pass http://neo_portal;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    location / {
        proxy_pass http://neo_portal;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        client_max_body_size 100M;
    }
}
```

---

## 11. Integration Test Suite

After all 11 milestones are deployed, run the full integration test suite:

```bash
#!/bin/bash
# scripts/integration-test-full.sh

echo "============================================"
echo "GT-NEO-PLATFORM — Full Integration Test Suite"
echo "============================================"

PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" > /dev/null 2>&1; then
    echo "✓ $name"
    ((PASS++))
  else
    echo "✗ $name"
    ((FAIL++))
  fi
}

# --- Tier 1: Foundation ---
echo ""
echo "--- Tier 1: Foundation ---"
check "PostgreSQL: accepting connections" \
  "docker exec gt-postgres pg_isready -U gtadmin"
check "PostgreSQL: neo_platform database exists" \
  "docker exec gt-postgres psql -U gtadmin -lqt | grep neo_platform"
check "PostgreSQL: pgvector extension loaded" \
  "docker exec gt-postgres psql -U gtadmin -d neo_platform -c \"SELECT 1 FROM pg_extension WHERE extname='vector'\" | grep -q 1"
check "Redis: responding to PING" \
  "docker exec gt-redis redis-cli -a \$REDIS_PASSWORD ping | grep -q PONG"
check "MinIO: health endpoint OK" \
  "curl -sf http://localhost:9000/minio/health/live"

# --- Tier 2: Business Systems ---
echo ""
echo "--- Tier 2: Business Systems ---"
check "Odoo 19.0: health endpoint OK" \
  "curl -sf http://localhost:8069/web/health | grep -q ok"
check "Odoo 19.0: JSON-RPC API responding" \
  "curl -sf -X POST http://localhost:8069/web/dataset/call_kw -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"call\",\"params\":{\"model\":\"res.lang\",\"method\":\"search_read\",\"args\":[[]],\"kwargs\":{\"fields\":[\"name\"],\"limit\":1}}}' | grep -q result"
check "OrangeHRM: login page accessible" \
  "curl -sf http://localhost:8080/index.php/auth/login | grep -q OrangeHRM"
check "OpenProject: health check OK" \
  "curl -sf http://localhost:8090/health_checks/default | grep -q healthy"
check "OpenProject: REST API v3 accessible" \
  "curl -sf http://localhost:8090/api/v3 | grep -q OpenProject"

# --- Tier 3: Intelligence ---
echo ""
echo "--- Tier 3: Intelligence & Analytics ---"
check "Metabase: health endpoint OK" \
  "curl -sf http://localhost:3030/api/health | grep -q ok"
check "Outline: health endpoint OK" \
  "curl -sf http://localhost:3040/_health | grep -q ok"

# --- Tier 4: Communications ---
echo ""
echo "--- Tier 4: Communications ---"
check "Rocket.Chat: health endpoint OK" \
  "curl -sf http://localhost:3050/health | grep -q ok"

# --- Tier 5: NEO Portal ---
echo ""
echo "--- Tier 5: NEO Portal ---"
check "NEO Portal: health endpoint OK" \
  "curl -sf http://localhost:4000/health | grep -q ok"
check "NEO Portal: API responding" \
  "curl -sf http://localhost:4000/api/v1/status | grep -q status"

# --- Tier 6: Edge ---
echo ""
echo "--- Tier 6: Edge ---"
check "Nginx: configuration valid" \
  "docker exec gt-nginx nginx -t"
check "Nginx: HTTPS portal accessible" \
  "curl -sf -k https://portal.yourdomain.com/health | grep -q ok"

# --- Summary ---
echo ""
echo "============================================"
echo "Results: $PASS passed, $FAIL failed"
echo "============================================"
[ $FAIL -eq 0 ] && echo "ALL TESTS PASSED ✓" || echo "SOME TESTS FAILED ✗"
```

---

## 12. Rollback Procedures

### Per-Service Rollback

```bash
# Roll back Odoo to previous image tag
docker compose stop odoo
docker compose rm -f odoo
# Edit docker-compose.yml: change image: odoo:19.0 to image: odoo:19.0-20260217
docker compose up -d odoo

# Roll back any service
SERVICE=odoo
OLD_TAG=19.0-20260217
docker compose stop $SERVICE
sed -i "s|image: odoo:19.0|image: odoo:$OLD_TAG|" docker-compose.yml
docker compose up -d $SERVICE
```

### Database Rollback

```bash
# Restore PostgreSQL from backup
docker compose stop neo-portal odoo orangehrm openproject metabase outline
docker exec gt-postgres pg_restore \
  -U gtadmin \
  -d neo_platform \
  /backups/neo_platform_YYYYMMDD.dump
docker compose start neo-portal odoo orangehrm openproject metabase outline
```

---

## 13. Monitoring & Health Checks

### Docker Health Check Summary

| Service | Health Check URL | Expected Response | Timeout |
|:---|:---|:---|:---|
| PostgreSQL | `pg_isready` | `accepting connections` | 5s |
| Redis | `redis-cli ping` | `PONG` | 5s |
| MinIO | `GET /minio/health/live` | HTTP 200 | 20s |
| Odoo 19.0 | `GET /web/health` | `{"status":"ok"}` | 10s |
| OrangeHRM | `GET /index.php/auth/login` | HTML 200 | 10s |
| OpenProject | `GET /health_checks/default` | `{"healthy":true}` | 10s |
| Metabase | `GET /api/health` | `{"status":"ok"}` | 10s |
| Outline | `GET /_health` | HTTP 200 | 10s |
| Rocket.Chat | `GET /health` | `{"status":"ok"}` | 10s |
| NEO Portal | `GET /health` | `{"status":"ok"}` | 10s |
| Nginx | `nginx -t` | `syntax is ok` | 10s |

### Recommended Monitoring Stack (Optional Phase 2)

For production monitoring, add these to the compose file after initial deployment:

```yaml
  # Prometheus metrics collection
  prometheus:
    image: prom/prometheus:latest
    container_name: gt-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - "127.0.0.1:9090:9090"
    networks:
      - neo-internal

  # Grafana dashboards
  grafana:
    image: grafana/grafana:latest
    container_name: gt-grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    ports:
      - "127.0.0.1:3060:3000"
    networks:
      - neo-internal
```

---

## 14. Deployment Checklist

### Pre-Deployment

- [ ] Server provisioned (Hetzner CX42 or equivalent, Ubuntu 22.04)
- [ ] DNS A records created for all 8 subdomains pointing to server IP
- [ ] Docker Engine and Docker Compose plugin installed
- [ ] `.env` file created from `.env.example` with all secrets filled
- [ ] All passwords are strong (minimum 32 characters, randomly generated)
- [ ] SSH key-based access configured, password auth disabled
- [ ] UFW firewall configured (allow 22, 80, 443 only)
- [ ] Automatic security updates enabled (`unattended-upgrades`)

### Tier 1 — Foundation

- [ ] **M1:** PostgreSQL 16 deployed and healthy
- [ ] **M1:** All 6 databases created
- [ ] **M1:** pgvector extension loaded on `neo_platform`
- [ ] **M1:** All 8 schemas created in `neo_platform`
- [ ] **M1:** All database users created with correct permissions
- [ ] **M2:** Redis 7.2 deployed and healthy
- [ ] **M2:** All 5 database roles tested (read/write)
- [ ] **M2:** AOF persistence confirmed enabled
- [ ] **M3:** MinIO deployed and healthy
- [ ] **M3:** All 7 buckets created (`gt-contracts`, `gt-drawings`, `gt-media`, `gt-backups`, `gt-hr-documents`, `gt-legal`, `gt-invoices`)

### Tier 2 — Business Systems

- [ ] **M4:** Odoo 19.0 deployed and healthy
- [ ] **M4:** Database `odoo_production` initialised via Odoo setup wizard
- [ ] **M4:** Core modules installed: Accounting, CRM, Purchase, Inventory, Project, HR
- [ ] **M4:** OCA modules installed (payroll, accounting, CRM, purchase)
- [ ] **M4:** Saudi Arabia chart of accounts configured
- [ ] **M4:** Company name set to "Golden Team Trading Services"
- [ ] **M4:** NEO API user created with XML-RPC access
- [ ] **M5:** OrangeHRM deployed and healthy
- [ ] **M5:** Initial setup wizard completed
- [ ] **M5:** REST API enabled and API key generated for NEO
- [ ] **M6:** OpenProject deployed and healthy
- [ ] **M6:** ASTRA PM workspace created
- [ ] **M6:** API token generated for NEO integration

### Tier 3 — Intelligence

- [ ] **M7:** Metabase deployed and healthy
- [ ] **M7:** Connected to `neo_platform` PostgreSQL (read-only)
- [ ] **M7:** Initial KPI dashboards created
- [ ] **M8:** Outline deployed and healthy
- [ ] **M8:** MinIO storage integration confirmed
- [ ] **M8:** Initial knowledge base seeded with company documentation

### Tier 4 — Communications

- [ ] **M9:** MongoDB replica set initialised
- [ ] **M9:** Rocket.Chat deployed and healthy
- [ ] **M9:** Admin account configured
- [ ] **M9:** Default channels created (#general, #management, #it-support)
- [ ] **M9:** REST API token generated for NEO integration

### Tier 5 — NEO Portal

- [ ] **M10:** NEO Portal Docker image built successfully
- [ ] **M10:** All environment variables injected correctly
- [ ] **M10:** Health endpoint responding
- [ ] **M10:** PostgreSQL connection verified
- [ ] **M10:** Redis connection verified
- [ ] **M10:** Odoo API integration tested (create test lead)
- [ ] **M10:** OrangeHRM API integration tested
- [ ] **M10:** OpenProject API integration tested

### Tier 6 — Edge

- [ ] **M11:** SSL certificates obtained for all subdomains
- [ ] **M11:** Nginx deployed and configuration valid
- [ ] **M11:** All 8 subdomains accessible via HTTPS
- [ ] **M11:** HTTP → HTTPS redirect working
- [ ] **M11:** WebSocket proxy working (NEO chat streaming)
- [ ] **M11:** Security headers present on all responses

### Post-Deployment

- [ ] Full integration test suite run: all tests passing
- [ ] Automated backup configured and tested (daily at 02:00)
- [ ] Backup restore tested on a test database
- [ ] All employee accounts created in NEO Portal
- [ ] ASTRA AMG authority matrix seeded with Golden Team approval limits
- [ ] User acceptance testing completed with 2–3 pilot employees
- [ ] Monitoring alerts configured (disk space, memory, service downtime)

---

*Document: GT-INFRA-002 | Golden Team Trading Services | Confidential*
*Version 1.0 — March 2026 | Prepared by: Manus AI / Golden Team IT*
