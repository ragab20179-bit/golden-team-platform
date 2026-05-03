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

## Phase 18 — NEO Chat Bug Fix + AI Usage Dashboard + Demo Data
- [x] Fix NEO Chat canned-response bug: remove thinking parameter (budget_tokens:128) from invokeLLM
- [x] Update MANUS_SYSTEM_PROMPT with CONVERSATION RULES for natural greetings and small talk
- [x] Add getDailyUsage and getRecentCalls procedures to neoModules router
- [x] Build AI Usage Dashboard page (/portal/neo-usage) with KPI cards, daily charts, module breakdown, recent calls log
- [x] Add AI Usage nav item to PortalLayout sidebar (TrendingUp icon, pink accent)
- [x] Register /portal/neo-usage route in App.tsx
- [x] Create scripts/seed-demo-data.mjs — 68 realistic demo records across all 7 modules
- [x] Push Phases 4-18 to GitHub (ragab20179-bit/golden-team-platform)
- [x] 154/154 tests passing, 0 TypeScript errors

## Last Updated
2026-03-16 08:10 UTC — Phase 18 complete, NEO Chat fixed, AI Usage Dashboard live, demo data seeded, GitHub pushed

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

## Phase 14 — AI Module Query UI + GPT-4o Token Usage Tracking
- [x] Add neo_ai_usage table to drizzle/schema.ts (module, engine, promptTokens, completionTokens, totalTokens, costUsd, query, userId, createdAt)
- [x] Run pnpm db:push to create table
- [x] Update all 7 neoModules procedures to log token usage after each AI call
- [x] Add getUsageStats procedure to neoModules router (total cost, tokens by engine, by module, by day)
- [x] Build reusable AIModuleQueryPanel component (query input, submit, response card with dataSource + contextSummary)
- [x] Wire AIModuleQueryPanel into FinancialModule/KPIModule (analyzeFinancial)
- [x] Wire AIModuleQueryPanel into HRModule (businessIntelligence)
- [x] Wire AIModuleQueryPanel into ProcurementModule (analyzeFinancial / criticalThinking)
- [x] Wire AIModuleQueryPanel into QMSModule (qmsAnalysis)
- [x] Wire AIModuleQueryPanel into NEOCore Modules tab (all 7 modules with module selector)
- [x] Update neoModules.getMetrics to include real cost data from neo_ai_usage
- [x] Update NEO Core metrics tab to show real cost per request, total spend, token breakdown
- [x] Write vitest tests for usage tracking procedures (135/135 passing)
- [x] Save checkpoint

## Phase 15 — Wire 7 Module Pages to Live DB Data

- [ ] Audit all 7 module pages and DB schema for gaps
- [ ] Add erpRecords and crmContacts tables to schema, push migration
- [ ] Add legalCases table to schema, push migration
- [ ] Add qmsIncidents table to schema, push migration
- [ ] Build tRPC procedures for HR module (list, add, update, delete employees)
- [ ] Build tRPC procedures for KPI module (list, add, update targets + actuals)
- [ ] Build tRPC procedures for Procurement module (list, add, update items + POs)
- [ ] Build tRPC procedures for QMS module (list incidents, add, update, close)
- [ ] Build tRPC procedures for ERP module (list records, add, update)
- [ ] Build tRPC procedures for CRM module (list contacts, add, update, pipeline)
- [ ] Build tRPC procedures for Legal module (list cases, add, update, close)
- [ ] Wire HRModule.tsx to live employee data (table + stats + add/edit dialog)
- [ ] Wire KPIModule.tsx to live KPI targets (table + progress bars + add dialog)
- [ ] Wire ProcurementModule.tsx to live procurement items (table + add dialog)
- [ ] Wire QMSModule.tsx to live incidents (table + add/close dialog)
- [ ] Wire ERPModule.tsx to live ERP records (table + add dialog)
- [ ] Wire CRMModule.tsx to live CRM contacts (pipeline view + add dialog)
- [ ] Wire LegalModule.tsx to live legal cases (table + add/close dialog)
- [ ] Write vitest tests for all new procedures
- [ ] Save checkpoint
- [ ] Update Drive Vault with GT-NEO-015 document

## Phase 16 — NEO Voice (Real-Time WebRTC Voice Chat)

- [ ] Add `trpc.neo.realtimeToken` endpoint — mints ephemeral OpenAI token server-side
- [ ] Build `buildVoiceContext()` helper — queries DB and builds NEO system prompt with live company data
- [ ] Build `VoiceChat.tsx` component — WebRTC peer connection, mic capture, VAD, live transcript
- [ ] Add voice selector (alloy, echo, shimmer, nova, coral) to VoiceChat UI
- [ ] Add function-calling tools to voice session (raise request, query HR, check KPI, search vault)
- [ ] Integrate VoiceChat into NEO Chat page as Voice Mode toggle button
- [ ] Log voice session token usage to `neo_ai_usage` table
- [ ] Write vitest tests for token endpoint and context builder
- [ ] Save checkpoint
- [ ] Update Drive Vault with Phase 16 summary

## Phase 17 — Google Sign-In
- [ ] Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets
- [ ] Create server/routers/googleAuth.ts with OAuth callback handler
- [ ] Add /api/auth/google and /api/auth/google/callback Express routes
- [ ] Upsert user in DB from Google profile (email, name, picture)
- [ ] Add Google Sign-In button to login page
- [ ] Update Employee Portal button on public site to show Google option
- [ ] Write vitest tests for Google auth handler
- [ ] Save checkpoint and update Drive Vault

## Phase 19 — Voice API Bug Fix
- [x] Diagnose voice failure: OpenAI removed nova/fable/onyx from Realtime API voice list
- [x] Update server/routers/neoVoice.ts: voice enum → alloy/ash/ballad/coral/echo/sage/shimmer/verse/marin/cedar
- [x] Update client/src/components/VoiceChat.tsx: VOICES array updated, default changed to alloy
- [x] Update server/neoVoice.test.ts: replace nova with alloy in all 6 test cases
- [x] Verify live: ephemeral token minted successfully (sess_DK1q1ZfQhO5SiVuJ5Livt, model gpt-4o-realtime-preview)
- [x] 154/154 tests passing, 0 TypeScript errors

## Last Updated
2026-03-16 09:05 UTC — Phase 19 complete, voice API fully operational with updated voice list

## Phase 21 — Odoo Full Integration (Purchase + Accounting + Inventory + CRM + Project)
- [ ] Explore Odoo XML-RPC API — discover models and fields for all 5 modules
- [ ] Build server/odoo.ts — typed XML-RPC client helper (authenticate, search_read, create, write)
- [ ] Build tRPC odooRouter — procedures for Purchase, Accounting, Inventory, CRM, Project
- [ ] Build OdooDashboard portal page (/portal/odoo) with live Odoo data
- [ ] Add Odoo nav item to PortalLayout sidebar
- [ ] Register /portal/odoo route in App.tsx
- [ ] Write vitest tests for odoo router (odoo.test.ts)
- [ ] 182+ tests passing, 0 TypeScript errors

## Phase 20 — Universal File Upload + Advanced OCR for NEO Chat (2026-03-29)
- [x] Upgrade fileParser.ts: add PPTX parser (LibreOffice headless)
- [x] Upgrade fileParser.ts: add Pages/Numbers/ODT/RTF parser (LibreOffice headless)
- [x] Upgrade fileParser.ts: add Tesseract OCR (Arabic + English) for scanned PDFs and images
- [x] Upgrade fileParser.ts: add GPT-4 Vision fallback for complex images
- [x] Upgrade fileParser.ts: add sharp image preprocessing before OCR
- [x] Install system deps: tesseract-ocr, tesseract-ocr-ara, libreoffice, pdftoppm (poppler-utils)
- [x] Install npm dep: sharp (image preprocessing)
- [x] Add uploadIds parameter to neoChat.sendMessage tRPC procedure
- [x] Inject parsed file context into AI prompt via getUploadedFileContext
- [x] Wire real chunked upload pipeline into NEOChat.tsx (uploadFileThroughPipeline)
- [x] Add PendingUpload interface and state to NEOChat.tsx
- [x] Update file input accept attribute to include all supported formats
- [x] Update UniversalFileUpload component with PPTX/Pages/Numbers/RTF categories
- [x] Write vitest tests for fileParser (14 tests, all passing)
- [x] TypeScript: 0 errors, 190/190 tests passing

## Phase 20 (2026-03-29) — Universal File Upload + Advanced OCR for NEO Chat
- [x] Upgrade fileParser.ts: PPTX, Pages, Numbers, ODT, RTF parsers (LibreOffice headless)
- [x] Upgrade fileParser.ts: Tesseract OCR (Arabic + English) for scanned PDFs and images
- [x] Upgrade fileParser.ts: GPT-4 Vision fallback + sharp image preprocessing
- [x] Install system deps: tesseract-ocr, tesseract-ocr-ara, libreoffice, pdftoppm
- [x] Install npm dep: sharp (image preprocessing)
- [x] Add uploadIds to neoChat.sendMessage + inject parsed file context into AI prompt
- [x] Wire real chunked upload pipeline into NEOChat.tsx (uploadFileThroughPipeline)
- [x] Add PendingUpload interface + state + file input accept all formats
- [x] Update UniversalFileUpload with PPTX/Pages/Numbers/RTF categories
- [x] Write vitest tests for fileParser (14 tests, all passing)
- [x] TypeScript: 0 errors, 190/190 tests passing

## Phase 21 — Login Fix + File Preview + Persistent Context + Bulk Analysis
- [x] Fix Employee Portal login flow (confirmed working by user)
- [x] File preview card in NEO Chat — collapsible card showing extracted file content below AI response
- [x] Persistent file context across turns — store uploadIds with conversation for follow-up messages
- [x] Bulk document analysis mode — dedicated button for multi-file comparison/summary reports
- [x] Write vitest tests for all new features (24 new tests, 214 total passing)

## 2026-03-30 — Universal File Upload in All AI Chat Windows
- [x] Add uploadIds support to all 7 neoModules backend procedures (financial, risk, decision, problems, qms, BI, chat)
- [x] Upgrade AIModuleQueryPanel with file upload drop zone, drag-and-drop, bin icon, and uploadIds
- [x] Upgrade NEOChatWindow with file upload drop zone, drag-and-drop, bin icon, and uploadIds
- [x] Verify file upload works in all 7 module pages (Procurement, CRM, ERP, HR, KPI, Legal, QMS)
- [x] Verify file upload works in MeetingModule and Portal Dashboard
- [x] TypeScript clean (0 errors, confirmed via fresh tsc --noEmit)
- [x] Write vitest tests for uploadIds in neoModules (13 new tests, 227 total passing)

## Real-Time WebSocket Audio Conversation for NEO Chat
- [x] Audit current WebRTC voice implementation and identify gaps
- [x] Build WebSocket server endpoint for bidirectional audio streaming to OpenAI Realtime API
- [x] Implement server-side WebSocket relay: browser audio -> server WS -> OpenAI Realtime WS -> server -> browser (616 lines)
- [x] Build frontend audio capture (AudioWorklet PCM16 24kHz) with WebSocket streaming
- [x] Build frontend audio playback from WebSocket audio chunks (AudioContext queue)
- [x] Integrate live transcript display (user + assistant) via WebSocket events
- [x] Integrate function-calling tools (KPI, vault search, requests, raise request) via WebSocket
- [x] Add voice selector (10 voices), language selector (auto/en/ar), mute/unmute controls
- [x] Add VAD (Voice Activity Detection) visual indicators (pulse animations)
- [x] Add session duration timer and token usage tracking + cost calculation
- [x] Wire VoiceChatWS into NEO Chat page (replaced old WebRTC VoiceChat)
- [x] Write vitest tests for WebSocket voice relay (33 new tests)
- [x] TypeScript clean (0 errors, confirmed via fresh tsc --noEmit)
- [x] 260 total tests passing
- [x] Save checkpoint

## 2026-04-03 — Universal File Upload Bug Fixes + Advanced Parsing Upgrade
- [x] Fix AIModuleQueryPanel.tsx: field name `data` → `chunkData` (matching backend schema)
- [x] Fix AIModuleQueryPanel.tsx: field name `sizeBytes` → `fileSize` (matching backend schema)
- [x] Fix AIModuleQueryPanel.tsx: context value `ai-module-*` → `global`
- [x] Fix NEOChatWindow.tsx: field name `data` → `chunkData` (matching backend schema)
- [x] Fix NEOChatWindow.tsx: field name `sizeBytes` → `fileSize` (matching backend schema)
- [x] Fix NEOChatWindow.tsx: context value `neo-chat-window` → `global`
- [x] Upgrade fileParser.ts: add Tesseract OCR (Arabic + English) for images and scanned PDFs
- [x] Upgrade fileParser.ts: add sharp image preprocessing before OCR
- [x] Upgrade fileParser.ts: add PPTX/PPT parser via LibreOffice headless
- [x] Upgrade fileParser.ts: add Pages/Numbers/ODT/RTF parser via LibreOffice headless
- [x] Upgrade fileParser.ts: add scanned PDF OCR fallback (pdftoppm → Tesseract)
- [x] Update detectCategory for new file types (PPTX, Pages, Numbers, RTF, ODT, ODS, ODP, HEIC, HEIF)
- [x] Write/update vitest tests for all fixes (281/281 passing)
- [x] Save checkpoint (version 55f8f8d1)

## 2026-04-29 — Brand Identity Update (Canva Assets)

- [x] Extract clean transparent logo PNG from Canva letterhead
- [x] Rebuild company profile PDF with real brand colors (#0A323C teal, #5A6446 olive, #FADC96 gold), real logo, real company details
- [x] Update website CSS color variables to match real brand palette
- [x] Upload real logo to CDN (https://d2xsxph8kpxj0f.cloudfront.net/.../gt_logo_official_d0b30b07.png)
- [x] Update website navigation/header logo from GT monogram to real logo
- [x] Update Home.tsx hero section with real brand colors
- [x] Save checkpoint after brand update

## 2026-04-29 — Construction Section + KDP Project Page

- [x] Add Construction nav link to Home.tsx (desktop + mobile + footer)
- [x] Add "الإنشاءات" Arabic translation to i18n.ts
- [x] Create /construction page with Ongoing Projects section and KDP project card
- [x] Create /construction/kdp dedicated project page with full CGI gallery
- [x] Download 12 KDP CGI renders (TIFF) from Google Drive and convert to JPEG
- [x] Upload 12 KDP CGI images to CDN
- [x] Embed real project details: Al Khobar City Center, 2.4M m², 3 districts, SAR 4.2B
- [x] Add App.tsx routes: /construction, /construction/kdp
- [x] TypeScript: 0 errors confirmed
- [ ] Save checkpoint

## 2026-04-29 — KDP Showcase on Home Page
- [x] Add KDP project showcase section to Home.tsx (bilingual Arabic/English overview, CGI images, link to /construction/kdp)
- [ ] Save checkpoint

## 2026-04-29 — Nadheem (Green Riyadh) Project
- [ ] Search Google Drive and desktop for Nadheem/Green Riyadh project files
- [ ] Download and extract project details, images, CGI renders
- [ ] Build dedicated /construction/nadheem project page
- [ ] Add Nadheem card to /construction page
- [ ] Add Nadheem showcase to Home.tsx ongoing projects section
- [ ] Save checkpoint

## 2026-05-02 — Frontend Reorganisation
- [x] Move 20 portal pages into pages/portal/ subdirectory
- [x] Move 12 public pages into pages/public/ subdirectory
- [x] Update all import paths in App.tsx and affected files
- [x] Add React.lazy() + Suspense code splitting to App.tsx for all 36 routes
- [x] Add auth guard (useAuth) to PortalLayout.tsx — redirect unauthenticated users
- [x] Add auth guard (useAuth) to AdminLayout.tsx — redirect non-admin users
- [x] Fix glow-teal Vite pre-transform warning in index.css
- [ ] Run TypeScript check (0 errors)
- [ ] Run vitest (all tests passing)
- [ ] Save checkpoint

## 2026-05-02 — Frontend Reorganisation
- [x] Move 20 portal pages into pages/portal/ subdirectory
- [x] Move 12 public pages into pages/public/ subdirectory
- [x] Update all import paths in App.tsx and affected files
- [x] Add React.lazy() + Suspense code splitting to App.tsx for all 36 routes
- [x] Add auth guard (useAuth) to PortalLayout.tsx
- [x] Add auth guard (useAuth) to AdminLayout.tsx
- [x] Fix glow-teal Vite pre-transform warning in index.css

## 2026-05-02 — Phase 15: Live Data + Bulk Import (Option C)
- [ ] Seed HR module with 12 representative Golden Team employees
- [ ] Seed KPI module with 10 KPI targets across all departments
- [ ] Seed Procurement module with 8 PO items
- [ ] Seed QMS module with 6 NCR/incident records
- [ ] Seed ERP module with 8 financial records
- [x] Seed CRM module with 10 contacts/leads
- [ ] Seed Legal module with 6 contracts/cases
- [ ] Add bulk import (CSV/Excel) to QMSModule.tsx
- [ ] Add bulk import (CSV/Excel) to ERPModule.tsx
- [ ] Add bulk import (CSV/Excel) to CRMModule.tsx
- [ ] Add bulk import (CSV/Excel) to LegalModule.tsx

## 2026-05-02 — Fix Employee Portal Login
- [x] Diagnose login flow root cause (OAuth callback always redirected to "/" ignoring state)
- [x] Fix Manus OAuth callback to parse returnPath from state and redirect to /portal
- [x] Fix Login.tsx to pass /portal as returnPath to Manus OAuth URL
- [x] Verify 0 TypeScript errors, 297/297 tests passing

## 2026-05-02 — Odoo Live Connection
- [x] Test live connection to goldenteam1.odoo.com (DB: golden-team-1)
- [x] Store ODOO_URL, ODOO_DB, ODOO_API_KEY, ODOO_USERNAME as secrets
- [x] Add 12 missing Odoo procedures (getHealth, getEmployees, getPayslips, getLeaves, createLeave, getAnalyticLines, getSalesOrders, createSalesOrder, confirmPurchaseOrder, validateStockPicking, createInvoice, postInvoice, registerPayment, updateCrmLeadStage)
- [x] Add Odoo connection health indicator to OdooDashboard (live badge + offline/degraded banners)
- [x] Add env validation test for ODOO_URL and ODOO_DB

## Email/Password Auth (Phase 22)
- [x] Add passwordHash column to users table (ALTER TABLE)
- [x] Add getUserByEmail() to db.ts (prefers local account with passwordHash)
- [x] Add auth.emailLogin tRPC procedure with bcrypt verification + session cookie
- [x] Seed super admin: ragab20179@gmail.com / GoldenTeam@2026 (role: admin)
- [x] Rewrite Login.tsx with email+password form wired to auth.emailLogin
- [x] Fix getUserByEmail to prefer local account when multiple users share same email

## Phase 23 — Odoo Circuit Breaker Fix + AI Data Entry + Integration Report
- [x] Fix circuit breaker: all read procedures return empty array + offline flag (not throw) when breaker open
- [x] Generate full Odoo integration report (Markdown + PDF)
- [x] Build AI-powered Odoo data entry page: NEO chat → parse order → confirm → execute into Odoo
- [x] Add odoo.aiDataEntry tRPC procedure (LLM parses natural language → calls Odoo mutations)
- [x] Register /portal/odoo/ai-entry route in App.tsx + NEO AI Entry button on OdooDashboard

## Phase 24 — NEO FastAPI Odoo Bridge

- [x] Clone rosenvladimirov/odoo-claude-mcp and extract XML-RPC client + tool definitions
- [x] Build NEO FastAPI bridge service (Python): odoo_client.py + tools.py + executor.py + main.py
- [x] Add OpenAI function-calling router with /parse, /execute, /chat, /health endpoints
- [x] Add neoBridgeChat, neoBridgeExecute, neoBridgeHealth tRPC procedures to odoo router
- [x] Extend OdooAIDataEntry.tsx: voice input (Web Speech API), bridge health indicator, bridge confirm card
- [x] Add Dockerfile + docker-compose for bridge deployment
- [x] Write DEPLOYMENT.md (Railway/Render/Docker/Python options)
- [x] All 301 tests passing, 0 TypeScript errors

## Phase 25 — Odoo AI Entries Audit Log (COMPLETE)
- [x] Add odoo_ai_entries table to Drizzle schema
- [x] Create table in production DB via direct SQL (migration conflict bypass)
- [x] Add logOdooAiEntry, updateOdooAiEntry, getOdooAiEntries, getOdooAiEntryStats, clearOdooAiEntries DB helpers
- [x] Add getAiEntries, getAiEntryStats, clearAiEntries tRPC procedures to odoo router
- [x] Wire auto-logging (logOdooAiEntry + updateOdooAiEntry) into aiDataEntry execute step
- [x] Build OdooAuditLog.tsx page: KPI cards, top operations, filters, paginated table, detail dialog, clear all
- [x] Add Audit Log button to OdooDashboard header
- [x] Register /portal/odoo/audit-log route in App.tsx
- [x] 301 tests passing, 0 TypeScript errors

## Phase 26 — Items 1-10 Full Implementation
- [ ] Item 1: Activate NEO FastAPI Bridge — wire NEO_BRIDGE_URL + NEO_BRIDGE_API_KEY secrets, bridge health check UI
- [ ] Item 2: Change Password UI — portal settings page with changePassword tRPC procedure
- [ ] Item 3: Employee Account Creation — admin-only createEmployee dialog + procedure
- [ ] Item 4: Audit Log CSV/Excel Export — exportAiEntries procedure + download button on OdooAuditLog
- [ ] Item 5: Voice input on NEO Chat — Web Speech API mic button in NEOChat.tsx composer
- [ ] Item 6: Unified AI Audit Trail — extend ai_audit_log to NEO Chat, ASTRA, Risk Assessment
- [ ] Item 7: Odoo Sales Orders — getSalesOrders tRPC procedure + Sales tab on OdooDashboard
- [ ] Item 8: Role-based portal access — module_access table + access control per user role
- [ ] Item 9: Scheduled AI reports — weekly KPI/Odoo summary endpoint + schedule task
- [ ] Item 10: Mobile-responsive portal — sidebar hamburger menu + Odoo dashboard mobile pass
