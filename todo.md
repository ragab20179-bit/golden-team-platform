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

## Bug Fixes
- [x] Fix duplicated main title on landing page hero section (replaced bg image + updated h1 tagline)
- [x] Add animated particle network canvas overlay to hero section

## Phase 4 — Full Bilingual Arabic/English
- [x] Build i18n translation system with Arabic/English context, RTL support, and language switcher
- [x] Translate public landing page (all sections, nav, hero, services, stats, testimonials, footer)
- [x] Translate employee portal and all portal pages (sidebar, NEO engine, dashboard, modules)
- [x] Translate ASTRA AMG governance module, Authority Matrix, and all governance UI
- [x] Add language switcher to nav and portal sidebar with RTL layout toggle
- [x] Translate all service pages: IT Solutions, ASTRA PM, Consultancy, About, Contact
- [x] Translate all module pages: HR, ERP, CRM, KPI, Procurement, QMS, Legal, Comms, Audit, Governance, NEO Core
- [x] Semantic Arabic trade language (not literal translation) throughout

## Last Updated
2026-03-14 21:00 UTC — Phase 4 complete, full bilingual Arabic/English deployed

## Phase 5 — Universal File Upload (Drive Vault)
- [x] Audit ASTRA-TAWZEEF-V1 repo for file upload/parsing patterns
- [x] Add vault_files table to DB schema and push migration
- [x] Install pdf-parse, xlsx, mammoth for server-side parsing
- [x] Create server/fileParser.ts — universal parser (PDF, Excel, CSV, Word, JSON, Markdown, images)
- [x] Create server/db/vault.ts — all vault DB query helpers
- [x] Create server/routers/vault.ts — tRPC procedures (upload, list, search, download, delete)
- [x] Register vault router in server/routers.ts
- [x] Create FileUploadZone reusable drag-and-drop component
- [x] Create DriveVault page — full bilingual file manager UI with folder sidebar
- [x] Add /portal/vault route in App.tsx
- [x] Add Drive Vault nav item to PortalLayout sidebar
- [x] Write vitest tests (30 tests passing)
- [x] NEO AI auto-summarizes uploaded documents in background

## Last Updated
2026-03-14 21:35 UTC — Phase 5 complete, Drive Vault universal file upload deployed

## Phase 6 — Port Universal Upload System from Khobar Repo
- [x] Install missing dependencies: csv-parse, xml2js, dxf-parser, nanoid
- [x] Port server/fileParser.ts — full format support (PDF, Excel, CSV, XML, DOCX, Image/Vision, DXF, Text)
- [x] Fix detectCategory bug: DOCX MIME contains 'xml' substring — moved docx check before xml
- [x] Port server/routers/universalUpload.ts — 5-step chunked pipeline with parse status + AI context injection
- [x] Register universalUpload router in server/routers.ts
- [x] Port client/src/components/UniversalFileUpload.tsx — multi-file queue, speed/ETA, parse status
- [x] Replace FileUploadZone in DriveVault with UniversalFileUpload
- [x] Add bilingual labels to UniversalFileUpload component
- [x] Write vitest tests: 16 universalUpload tests + 13 vault tests = 48 total, all passing
- [x] Fix vault.test.ts to use new filePath-based parseFile API

## Last Updated
2026-03-15 17:09 UTC — Phase 6 complete, universal upload system ported from Khobar repo

## Phase 7 — Contextual Uploads, Bulk Import, Vision Re-analysis (COMPLETE)
- [x] Add contextType + contextId columns to vault_files schema and push migration
- [x] Update vault.uploadFile procedure to accept and store context fields
- [x] Add vault.listByContext tRPC procedure to fetch files per meeting/project
- [x] Update universalUpload.finalize to write to vault_files with context linking
- [x] Add file attachments panel to MeetingModule with UniversalFileUpload (context=meeting)
- [x] Create BulkImportDialog component — 4-step wizard (upload → column map → preview → import)
- [x] Create ModuleBulkImport.tsx — HRBulkImport, KPIBulkImport, ProcurementBulkImport wrappers
- [x] Add bulkImportHR, bulkImportKPI, bulkImportProcurement procedures to modules router
- [x] Add hrEmployees, kpiTargets, procurementItems tables to schema and push migration
- [x] Wire HRBulkImport into HRModule with Import button
- [x] Wire KPIBulkImport into KPIModule with Import KPI Targets button
- [x] Wire ProcurementBulkImport into ProcurementModule with Import button
- [x] Add reanalyzeMutation to DriveVault with Re-analyze with AI button (Wand2 icon)
- [x] Add no-summary prompt card in preview dialog when aiSummary is null
- [x] Background poll (5s) after re-analysis trigger to refresh summary
- [x] Write 22 vitest tests for modules router and contextual upload
- [x] 70 total tests passing (5 test files)

## Last Updated
2026-03-15 17:45 UTC — Phase 7 complete, all three features delivered

## Phase 8 — ASTRA PM Page Diagrams from Google Drive Vault
- [x] Browse Google Drive ASTRA PM vault folder for diagrams
- [x] Download all ASTRA PM diagrams (architecture, workflow, tech-stack, software-integration, infra-scaling, file-collab, team-structure, use-cases, implementation-timeline, market-opportunity)
- [x] Upload 10 diagrams to CDN via manus-upload-file --webdev
- [x] Integrate diagrams into ASTRA PM page with bilingual captions, category filter, and lightbox viewer

## Last Updated
2026-03-15 18:45 UTC — Phase 8 revised: replaced old placeholder URLs with actual latest diagrams from ASTRA PM VAULT (system_architecture_hybrid_4k, neo_ai_architecture_hybrid_4k, all 12 corrected 4K diagrams). Total: 14 diagrams from vault, 12 shown in gallery + 2 new entries (NEO AI Architecture, Competitive Advantage, Revenue Model).

## Phase 9 — Arabic Translation Fixes + Visual Logo Items
- [x] Audit all pages for hardcoded English strings not wrapped in t() calls
- [x] Fix ITSolutions.tsx: translate all hardcoded English strings to Arabic via t()
- [x] Replace text-only partner lists in ITSolutions.tsx tech stack section with real brand logos (Fortinet, Palo Alto, CrowdStrike, Splunk, AWS, Azure, GCP, Alibaba Cloud, React, Node.js, Python, PostgreSQL, Cisco, HPE, Dell EMC, VMware, Zabbix, Grafana, Prometheus, PagerDuty, NEO AI Core, UiPath, Power Automate, OpenAI)
- [x] Fix AstraPM.tsx: translate all feature/module/pricing/NEO section text + fix category filter for language switching
- [x] Fix Consultancy.tsx: translate all untranslated strings
- [x] Fix About.tsx: translate all untranslated strings
- [x] Fix Contact.tsx: translate all untranslated strings (cards, form options, toast messages)

## Last Updated
2026-03-15 19:05 UTC — Phase 9 complete, 70/70 tests passing, 0 TypeScript errors

## Phase 11 — NEO Chat/Intercom (M1 of Phase 2)
- [x] Add neo_conversations, neo_messages tables to DB schema and push migration
- [x] Build server/routers/neoChat.ts — tRPC procedures (createConversation, sendMessage, listConversations, getMessages, deleteConversation, archiveConversation)
- [x] Build AI routing logic — Manus/GPT/Hybrid router with keyword scoring (EN + AR keywords)
- [x] Build AI response via invokeLLM with conversation history context
- [x] Build NEOChat.tsx page — conversation sidebar + message thread + composer with drag-and-drop
- [x] Add /portal/neo-chat route in App.tsx
- [x] Add NEO Chat sidebar nav item to PortalLayout (bilingual EN/AR)
- [x] Write 18 vitest tests for neoChat router (routing algorithm, title generation, message validation, conversation types)
- [x] 88 total tests passing, 0 TypeScript errors

## Last Updated
2026-03-16 01:48 UTC — Phase 11 complete, NEO Chat M1 delivered, 88/88 tests passing

## Phase 12 — Request & Approval Engine (M3 of Phase 2)
- [x] Add requests, approval_steps, approval_actions tables to DB schema and push migration
- [x] Build server/routers/requests.ts — tRPC procedures (submitRequest, getMyRequests, getPendingApprovals, approveRequest, rejectRequest, cancelRequest, getRequestById, getStats)
- [x] Integrate ASTRA AMG authority matrix — auto-assign approvers based on request type + amount (≤10K/≤50K/≤500K SAR) + board threshold enforcement
- [x] Build Requests.tsx page — submit dialog, my requests list, pending approvals tab, detail dialog, approve/reject dialogs
- [x] Add /portal/requests route in App.tsx
- [x] Add Requests sidebar nav item to PortalLayout (bilingual EN/AR)
- [x] Full bilingual Arabic/English support in all request/approval UI
- [x] Write 27 vitest tests (request numbers, approval chains, ASTRA policy enforcement, validation)
- [x] 115 total tests passing, 0 TypeScript errors

## Last Updated
2026-03-16 02:10 UTC — Phase 12 complete, Request & Approval Engine M3 delivered, 115/115 tests passing

## Phase 13 — Real GPT-4 Integration + 7 AI Module Procedures + Live Metrics
- [x] Add OPENAI_API_KEY secret
- [x] Create server/_core/gpt.ts — OpenAI GPT-4o direct helper
- [x] Update server/_core/env.ts to expose OPENAI_API_KEY
- [x] Update neoChat router to call invokeGPT for gpt/hybrid routing decisions
- [x] Build server/routers/neoModules.ts with 7 AI module procedures
- [x] Add neoModules.getMetrics procedure (real DB counts)
- [x] Wire neoModules router into appRouter
- [x] Update NEOCore.tsx to fetch live metrics from trpc.neoModules.getMetrics
- [x] Write vitest tests for all new procedures (15 tests)
- [x] Save checkpoint

## Last Updated
2026-03-16 07:35 UTC — Phase 13 complete, real GPT-4o integration + 7 AI module procedures + live metrics, 130/130 tests passing
