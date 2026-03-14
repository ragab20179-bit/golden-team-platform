-- =============================================================================
-- Golden Team NEO Platform — PostgreSQL Initialization Script
-- Creates all application databases, users, and extensions
-- Runs automatically on first container start
-- Document: GT-INFRA-001 | Version: 1.0 | March 2026
-- =============================================================================

-- Enable required extensions on postgres database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- CREATE APPLICATION USERS
-- =============================================================================

-- NEO Platform application user
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'neo_app') THEN
    CREATE ROLE neo_app WITH LOGIN PASSWORD 'PLACEHOLDER_NEO_PASSWORD';
  END IF;
END $$;

-- Odoo ERP user
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'odoo') THEN
    CREATE ROLE odoo WITH LOGIN PASSWORD 'PLACEHOLDER_ODOO_PASSWORD' CREATEDB;
  END IF;
END $$;

-- OrangeHRM user
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'orangehrm') THEN
    CREATE ROLE orangehrm WITH LOGIN PASSWORD 'PLACEHOLDER_ORANGEHRM_PASSWORD';
  END IF;
END $$;

-- OpenProject user
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'openproject') THEN
    CREATE ROLE openproject WITH LOGIN PASSWORD 'PLACEHOLDER_OPENPROJECT_PASSWORD';
  END IF;
END $$;

-- Metabase user (read-only access to NEO data for dashboards)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metabase') THEN
    CREATE ROLE metabase WITH LOGIN PASSWORD 'PLACEHOLDER_METABASE_PASSWORD';
  END IF;
END $$;

-- Outline wiki user
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'outline') THEN
    CREATE ROLE outline WITH LOGIN PASSWORD 'PLACEHOLDER_OUTLINE_PASSWORD';
  END IF;
END $$;

-- =============================================================================
-- CREATE DATABASES
-- =============================================================================

-- NEO Platform (primary operational database)
CREATE DATABASE neo_platform
  WITH OWNER = neo_app
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TEMPLATE = template0;

-- OrangeHRM
CREATE DATABASE orangehrm
  WITH OWNER = orangehrm
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TEMPLATE = template0;

-- OpenProject
CREATE DATABASE openproject
  WITH OWNER = openproject
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TEMPLATE = template0;

-- Metabase
CREATE DATABASE metabase
  WITH OWNER = metabase
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TEMPLATE = template0;

-- Outline
CREATE DATABASE outline
  WITH OWNER = outline
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TEMPLATE = template0;

-- =============================================================================
-- CONFIGURE NEO PLATFORM DATABASE
-- =============================================================================

\connect neo_platform

-- Install required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";          -- pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- trigram search for text matching
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- GIN indexes for JSONB

-- Create schemas
CREATE SCHEMA IF NOT EXISTS core AUTHORIZATION neo_app;
CREATE SCHEMA IF NOT EXISTS ops AUTHORIZATION neo_app;
CREATE SCHEMA IF NOT EXISTS kb AUTHORIZATION neo_app;
CREATE SCHEMA IF NOT EXISTS ai AUTHORIZATION neo_app;
CREATE SCHEMA IF NOT EXISTS integrations AUTHORIZATION neo_app;
CREATE SCHEMA IF NOT EXISTS business AUTHORIZATION neo_app;
CREATE SCHEMA IF NOT EXISTS policy AUTHORIZATION neo_app;
CREATE SCHEMA IF NOT EXISTS metrics AUTHORIZATION neo_app;

-- Grant schema usage to metabase (read-only BI access)
GRANT USAGE ON SCHEMA core, ops, kb, ai, metrics TO metabase;
GRANT SELECT ON ALL TABLES IN SCHEMA core TO metabase;
GRANT SELECT ON ALL TABLES IN SCHEMA ops TO metabase;
GRANT SELECT ON ALL TABLES IN SCHEMA metrics TO metabase;
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT ON TABLES TO metabase;
ALTER DEFAULT PRIVILEGES IN SCHEMA ops GRANT SELECT ON TABLES TO metabase;
ALTER DEFAULT PRIVILEGES IN SCHEMA metrics GRANT SELECT ON TABLES TO metabase;

-- =============================================================================
-- CORE SCHEMA — Identity, Conversations, Messages, Meetings, Files
-- =============================================================================

CREATE TABLE core.users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     text UNIQUE,
  email           text UNIQUE NOT NULL,
  full_name       text NOT NULL,
  full_name_ar    text,
  role_code       text NOT NULL DEFAULT 'employee',
  department_code text,
  authority_level integer NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true,
  mfa_enabled     boolean NOT NULL DEFAULT false,
  mfa_secret      text,
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core.conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES core.users(id),
  title           text,
  context_type    text NOT NULL DEFAULT 'general',
  context_ref_id  uuid,
  is_archived     boolean NOT NULL DEFAULT false,
  message_count   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES core.conversations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES core.users(id),
  role            text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         text NOT NULL,
  language_code   text NOT NULL DEFAULT 'en',
  engine_used     text,
  tokens_used     integer,
  latency_ms      integer,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core.meetings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  meeting_type    text NOT NULL DEFAULT 'internal',
  project_code    text,
  scheduled_at    timestamptz,
  started_at      timestamptz,
  ended_at        timestamptz,
  status          text NOT NULL DEFAULT 'scheduled',
  transcript_raw  text,
  summary         text,
  created_by      uuid NOT NULL REFERENCES core.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core.meeting_participants (
  meeting_id  uuid NOT NULL REFERENCES core.meetings(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES core.users(id),
  role        text NOT NULL DEFAULT 'attendee',
  PRIMARY KEY (meeting_id, user_id)
);

CREATE TABLE core.files (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  mime_type       text NOT NULL,
  size_bytes      bigint NOT NULL,
  storage_bucket  text NOT NULL DEFAULT 'neo-files',
  storage_key     text NOT NULL UNIQUE,
  uploaded_by     uuid NOT NULL REFERENCES core.users(id),
  context_type    text,
  context_ref_id  uuid,
  is_deleted      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- OPS SCHEMA — Requests, Approvals, Decisions, Audit
-- =============================================================================

CREATE TABLE ops.requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type    text NOT NULL,
  title           text NOT NULL,
  description     text,
  requested_by    uuid NOT NULL REFERENCES core.users(id),
  conversation_id uuid REFERENCES core.conversations(id),
  status          text NOT NULL DEFAULT 'pending',
  priority        text NOT NULL DEFAULT 'normal',
  amount_sar      numeric(15,2),
  payload         jsonb NOT NULL DEFAULT '{}',
  target_system   text,
  target_action   text,
  result_payload  jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ops.approvals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid NOT NULL REFERENCES ops.requests(id),
  approver_id     uuid NOT NULL REFERENCES core.users(id),
  sequence        integer NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'pending',
  decision        text CHECK (decision IN ('approved', 'rejected', 'delegated', NULL)),
  comments        text,
  decided_at      timestamptz,
  deadline_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ops.decisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text NOT NULL,
  decision_type   text NOT NULL,
  decided_by      uuid NOT NULL REFERENCES core.users(id),
  meeting_id      uuid REFERENCES core.meetings(id),
  request_id      uuid REFERENCES ops.requests(id),
  ai_recommendation text,
  ai_confidence   numeric(5,4),
  final_outcome   text NOT NULL,
  rationale       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- IMMUTABLE AUDIT LOG — append-only, hash-chain integrity
CREATE TABLE ops.audit_events (
  id              bigserial PRIMARY KEY,
  event_id        uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  event_type      text NOT NULL,
  actor_id        uuid REFERENCES core.users(id),
  actor_email     text,
  target_type     text,
  target_id       text,
  action          text NOT NULL,
  payload_before  jsonb,
  payload_after   jsonb,
  ip_address      inet,
  user_agent      text,
  session_id      text,
  ai_engine       text,
  request_id      uuid,
  hash_chain_prev text,
  hash_chain_curr text NOT NULL,
  occurred_at     timestamptz NOT NULL DEFAULT now()
);

-- Prevent any modification or deletion of audit records
REVOKE UPDATE, DELETE, TRUNCATE ON ops.audit_events FROM neo_app;
CREATE RULE no_update_audit AS ON UPDATE TO ops.audit_events DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO ops.audit_events DO INSTEAD NOTHING;

-- =============================================================================
-- KB SCHEMA — Knowledge Base, Embeddings (RAG Pipeline)
-- =============================================================================

CREATE TABLE kb.knowledge_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  source_type     text NOT NULL,
  source_url      text,
  source_system   text,
  content_hash    text NOT NULL,
  language_code   text NOT NULL DEFAULT 'en',
  tags            text[],
  is_active       boolean NOT NULL DEFAULT true,
  created_by      uuid REFERENCES core.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kb.knowledge_chunks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         uuid NOT NULL REFERENCES kb.knowledge_items(id) ON DELETE CASCADE,
  chunk_index     integer NOT NULL,
  content         text NOT NULL,
  token_count     integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kb.embeddings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id        uuid NOT NULL REFERENCES kb.knowledge_chunks(id) ON DELETE CASCADE,
  model_name      text NOT NULL DEFAULT 'text-embedding-3-small',
  embedding       vector(1536) NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- IVFFlat index for approximate nearest neighbor search
CREATE INDEX ON kb.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- AI SCHEMA — Routing Logs, Model Calls, Learning Signals
-- =============================================================================

CREATE TABLE ai.routing_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES core.conversations(id),
  message_id      uuid REFERENCES core.messages(id),
  input_text      text NOT NULL,
  manus_score     integer,
  gpt_score       integer,
  hybrid_boost    integer,
  engine_selected text NOT NULL,
  complexity_score integer,
  risk_score      integer,
  modules_activated text[],
  latency_ms      integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai.model_calls (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_log_id  uuid REFERENCES ai.routing_logs(id),
  engine          text NOT NULL,
  model_name      text NOT NULL,
  prompt_tokens   integer,
  completion_tokens integer,
  total_tokens    integer,
  cost_usd        numeric(10,6),
  latency_ms      integer,
  success         boolean NOT NULL DEFAULT true,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- POLICY SCHEMA — ASTRA AMG Governance
-- =============================================================================

CREATE TABLE policy.authority_matrix (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type           text NOT NULL,
  min_amount_sar        numeric(15,2),
  max_amount_sar        numeric(15,2),
  required_role_code    text NOT NULL,
  requires_dual_approval boolean NOT NULL DEFAULT false,
  escalation_role_code  text,
  policy_reference      text,
  effective_from        date NOT NULL DEFAULT CURRENT_DATE,
  effective_to          date,
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE policy.policy_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code       text UNIQUE NOT NULL,
  rule_name       text NOT NULL,
  description     text,
  rule_type       text NOT NULL,
  conditions      jsonb NOT NULL DEFAULT '{}',
  actions         jsonb NOT NULL DEFAULT '{}',
  severity        text NOT NULL DEFAULT 'medium',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- METRICS SCHEMA — KPI Time-Series Data
-- =============================================================================

CREATE TABLE metrics.kpi_readings (
  time            timestamptz NOT NULL,
  kpi_code        text NOT NULL,
  value           numeric(20,4) NOT NULL,
  unit            text NOT NULL DEFAULT 'count',
  source_system   text NOT NULL,
  project_code    text,
  department_code text,
  metadata        jsonb
);

-- Create TimescaleDB hypertable if TimescaleDB is available
-- (falls back gracefully if not installed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM create_hypertable('metrics.kpi_readings', 'time', if_not_exists => true);
  END IF;
END $$;

CREATE INDEX ON metrics.kpi_readings (kpi_code, time DESC);
CREATE INDEX ON metrics.kpi_readings (source_system, time DESC);

-- =============================================================================
-- BUSINESS SCHEMA — Golden Team Module Data
-- =============================================================================

CREATE TABLE business.legal_contracts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_ref    text UNIQUE NOT NULL,
  title           text NOT NULL,
  party_name      text NOT NULL,
  contract_type   text NOT NULL,
  value_sar       numeric(15,2),
  start_date      date,
  end_date        date,
  status          text NOT NULL DEFAULT 'draft',
  file_id         uuid REFERENCES core.files(id),
  ai_risk_score   numeric(5,4),
  ai_summary      text,
  created_by      uuid NOT NULL REFERENCES core.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE business.legal_obligations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     uuid NOT NULL REFERENCES business.legal_contracts(id),
  obligation_type text NOT NULL,
  description     text NOT NULL,
  due_date        date,
  amount_sar      numeric(15,2),
  alert_days_before integer NOT NULL DEFAULT 14,
  status          text NOT NULL DEFAULT 'active',
  extracted_by_ai boolean NOT NULL DEFAULT false,
  ai_confidence   numeric(5,4),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE business.crm_leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_ref        text UNIQUE NOT NULL,
  company_name    text NOT NULL,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  service_interest text,
  estimated_value_sar numeric(15,2),
  stage           text NOT NULL DEFAULT 'new',
  probability     numeric(5,2),
  assigned_to     uuid REFERENCES core.users(id),
  odoo_lead_id    integer,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- SEED DATA — Authority Matrix (initial governance rules)
-- =============================================================================

INSERT INTO policy.authority_matrix (action_type, min_amount_sar, max_amount_sar, required_role_code, requires_dual_approval, policy_reference) VALUES
  ('payment_approval',    0,        5000,     'manager',        false, 'GT-POLICY-FIN-001'),
  ('payment_approval',    5000,     50000,    'senior_manager', false, 'GT-POLICY-FIN-001'),
  ('payment_approval',    50000,    500000,   'director',       true,  'GT-POLICY-FIN-001'),
  ('payment_approval',    500000,   NULL,     'owner',          true,  'GT-POLICY-FIN-001'),
  ('po_approval',         0,        10000,    'manager',        false, 'GT-POLICY-PROC-001'),
  ('po_approval',         10000,    100000,   'senior_manager', false, 'GT-POLICY-PROC-001'),
  ('po_approval',         100000,   NULL,     'director',       true,  'GT-POLICY-PROC-001'),
  ('contract_sign',       0,        NULL,     'director',       true,  'GT-POLICY-LEGAL-001'),
  ('project_change_order',0,        50000,    'project_manager',false, 'GT-POLICY-PM-001'),
  ('project_change_order',50000,    NULL,     'director',       true,  'GT-POLICY-PM-001');

-- =============================================================================
-- INDEXES — Performance optimization
-- =============================================================================

CREATE INDEX idx_messages_conversation ON core.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_user ON core.messages(user_id, created_at DESC);
CREATE INDEX idx_requests_user ON ops.requests(requested_by, created_at DESC);
CREATE INDEX idx_requests_status ON ops.requests(status, created_at DESC);
CREATE INDEX idx_approvals_approver ON ops.approvals(approver_id, status);
CREATE INDEX idx_audit_actor ON ops.audit_events(actor_id, occurred_at DESC);
CREATE INDEX idx_audit_event_type ON ops.audit_events(event_type, occurred_at DESC);
CREATE INDEX idx_routing_engine ON ai.routing_logs(engine_selected, created_at DESC);
CREATE INDEX idx_model_calls_engine ON ai.model_calls(engine, created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_messages_content_fts ON core.messages USING gin(to_tsvector('english', content));
CREATE INDEX idx_knowledge_items_fts ON kb.knowledge_items USING gin(to_tsvector('english', title));

COMMIT;
