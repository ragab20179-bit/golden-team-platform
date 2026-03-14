# Golden Team Platform — TODO

## ASTRA AMG Integration (Phase 1)
- [x] Port ASTRA-TAWZEEF-V1 decision engine to TypeScript (astraEngine.ts)
- [x] Create Golden Team Policy Pack v2.0 with 7 business domains (28 actions)
- [x] Wire NEO Transaction Engine Stage 4 to live ASTRA engine
- [x] Build ASTRA AMG Governance page with Live Check, Decision Log, Policy Pack Viewer

## ASTRA AMG Integration (Phase 2 — DB Persistence)
- [x] Upgrade project to web-db-user (database + server + auth)
- [x] Add astra_decisions and astra_policy_rules tables to DB schema
- [x] Run pnpm db:push to create tables in production DB
- [x] Build backend tRPC API: logDecision, getDecisions, clearLog, getPolicyRules, upsertPolicyRule, deletePolicyRule
- [x] Add DENY demo scenarios domain to policy pack (board-only contract, M&A, critical system shutdown)
- [x] Wire Authority Matrix "Publish Changes" to persist rules to ASTRA DB via tRPC
- [x] Update GovernanceModule DecisionLog to read from DB (persistent audit trail)
- [x] Wire LiveCheckPanel to persist each decision to DB after engine call
- [x] Add clearAstraDecisions helper to server/db.ts

## GitHub & CI
- [x] Push all source code to GitHub (ragab20179-bit/golden-team-platform)
- [x] Set up branch protection on main
- [x] Fix CI workflow file location (.github/workflows/ci.yml)
- [x] Fix pnpm version conflict in CI
- [x] All 5 CI jobs passing on main

## Phase 3 — Pre-Launch Implementation (COMPLETE)
- [x] Wire NEO Stage 4 (Portal.tsx) to persist ASTRA decisions to astra_decisions DB table
- [x] Build Authority Matrix role editor dialog (Add/Edit role wired to upsertPolicyRule tRPC)
- [x] Add vitest tests for all 6 ASTRA tRPC procedures (18 tests, all passing)
- [x] Update Drive Vault with ASTRA AMG Phase 1 and Phase 2 documentation (GT-GOV-002)
- [x] Add rule builder UI (Rule Builder dialog live in Authority Matrix)

## Last Updated
2026-03-14 18:30 UTC — Phase 3 complete, all pre-launch items done
