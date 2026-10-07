# JFRESH OS — Phase 1, 2 & 3

The seven connected Phase 1 visuals for JFRESH OS, built as responsive HTML pages that share one design system.

**Simple Frontline. Powerful Management. One Connected JFRESH OS.**

## View it

Open `index.html` in a browser. No build step and no server needed.

| # | Visual | File |
|---|--------|------|
| 01 | Business Model Overview | `visuals/01-business-model.html` |
| 02 | System Scope Architecture | `visuals/02-system-scope.html` |
| 03 | User & Role Map | `visuals/03-user-role-map.html` |
| 04 | End-to-End Operational Flow (Golden Workflow) | `visuals/04-golden-workflow.html` |
| 05 | Business Rules & Control | `visuals/05-business-rules.html` |
| 06 | Performance & SLA Architecture | `visuals/06-kpi-sla.html` |
| 07 | Master Data Relationship Diagram | `visuals/07-master-data.html` |

`preview.html` shows any visual in PC, iPad and mobile frames side by side.

## Phase 2 — System Structure & Navigation (NP 1.0)

Phase 2 turns the Phase 1 foundation into the structure of the system: what screens exist, who sees them, how people move between them, and how every screen is built.

| Part | Where |
|------|-------|
| Phase 2 home (NP-01 to NP-06 + Definition of Done) | `phase2/index.html` |
| NP-01 Master Sitemap · NP-02 Information Architecture · NP-03 Role Navigation · NP-04 User Flows · NP-05 Screen Inventory · NP-06 Screen Framework | `phase2/np0*.html` |
| Traceability matrix (Phase 1 requirement → NB → NV → screen → role → workflow → permission) | `phase2/traceability.html`, `docs/phase2/traceability-matrix.csv` |
| Working app: role-based shells, 9 screen archetypes, 77 screens, all screen states | `app/index.html` |
| Markdown copies of every NP document | `docs/phase2/` |

**One source of truth.** Roles, permissions, menus, screens, flows and the 24 framework fields live in `assets/js/jfos-config.js`. The app, the HTML docs and the Markdown docs all read it, so they cannot drift. After editing it, run `node tools/build-phase2-docs.js` to refresh `docs/phase2/`.

**App routes.** `app/index.html#/<role>/<SCREEN-ID>[/<record>][?state=loading|empty|error|warning|success|noperm|offline]`. Roles: `operator`, `driver`, `supervisor`, `opsmgr`, `finance`, `sales`, `owner`, `client`. The demo strip at the top switches role and screen state; demo data is kept in the browser and can be reset there.

**Rules the app follows.** Menus, pages, buttons and price columns are hidden (not disabled) without the permission. Frontline gets one main action per screen and a bottom bar of at most five items on mobile; management gets a sidebar, filters and drill-down. Every change writes an audit entry (user, time, event, record, old → new value), saves are protected against double submit, and messages are plain Indonesian with English available.

NB codes: NB-04 (Receiving) and NB-05 (Reconciliation) come from the brief; the other NB codes are provisional until the approved list is supplied.

## Phase 3 — Design System (NP 1.0)

One reusable, responsive design system for every JFRESH OS screen. Every example on these pages is a real component, not a picture.

| Page | File |
|---|---|
| Phase 3 home (deliverables A–L, Definition of Done, Design QA checklist) | `phase3/index.html` |
| NP-01 Brand Digital Foundation | `phase3/np01-brand.html` |
| NP-02 Typography & Readability | `phase3/np02-typography.html` |
| NP-03 Grid, Spacing & Layout | `phase3/np03-grid.html` |
| NP-04 Core Component Library | `phase3/np04-components.html` |
| NP-05 Operational UI Patterns | `phase3/np05-operational.html` |
| NP-06 Management UI Patterns | `phase3/np06-management.html` |
| NP-07 State, Feedback & Accessibility | `phase3/np07-states.html` |
| Component documentation (purpose, variants, states, allowed / not recommended, responsive, accessibility, role, live example) | `phase3/docs.html` |
| Traceability Phase 1 → 2 → 3 for all 77 screens | `phase3/traceability.html` |

Code:

- `assets/css/jfos-tokens.css` — every token as a `--jf-*` CSS variable (colour, type, spacing 4–48, radius 4–24, shadow, sizes, grid 12/8/4) with per-device values. `jfresh.css` imports it and maps the Phase 1/2 variables onto it, so the whole site and the app share one system.
- `assets/css/jfos-ds.css` — component classes `.ds-*` with every state.
- `assets/js/jfos-ds.js` — `JFDS` render functions named like the components: `JFDS.Button.Primary()`, `JFDS.Input.Number()`, `JFDS.Card.Task()`, `JFDS.Status.Waiting()`, `JFDS.Pattern.WorkQueue()`, `JFDS.State.Offline()`. Labels are `[id, en]` pairs.
- `assets/js/jfos-ds-docs.js` — component documentation, Design QA, archetype → pattern map and Definition of Done data used by the pages.
- `assets/brand/phase3/` — the approved reference visuals for NP-01 to NP-07.

## Phase 4 — Access & App Shell (NP 1.0)

The app now runs only inside a signed-in session. Start at `app/login.html` (every demo account uses the password `jfresh123`; the demo panel on the login page lists them).

| Page | File |
|---|---|
| Login, forgot / reset password, account states, session expired | `app/login.html` |
| App shell with session, role menus, plant selector, profile menu, notifications | `app/index.html` |
| Phase 4 overview (NP-01 to NP-07, demo accounts, non-negotiables, Definition of Done) | `phase4/index.html` |
| Screen specifications (AUTH, SHELL, USER, NOTIF, LAND with every spec field) | `phase4/screens.html` |
| Test cases run in the browser + responsive checklist | `phase4/tests.html` |

Code:

- `assets/js/jfos-access.js` — `JFACCESS`, the one access module: login (no OTP, lockout after 5 tries), role / plant / permission resolution, `authorize()` (permission + plant / client scope), sessions (idle timeout, warning, extend, logout), password reset, notifications, audit.
- `app/screens-access.js` — profile, change password, switch role / plant, notification center / detail / settings, help.
- `assets/js/jfos-access-tests.js` — 51 test cases (login, access resolution, landing pages). Run `node tools/test-access.js`.
- `assets/js/jfos-access-docs.js` — data for the Phase 4 pages.
- `assets/brand/phase4/` — the approved reference visuals.

There is no server yet: the access rules run in the browser and prove behaviour, not security. A backend must repeat `authorize()` on every API call, store hashed passwords and keep sessions and the audit on the server.

## Phase 5 — Executive, Financial & Ambidex Performance OS (NP 1.0)

Sign in as `aji` (owner) to land on Executive Business Health. Every role gets the Phase 5 menus its permissions allow; frontline roles get a simple My Performance screen. Two Phase 5 demo roles: `wulan` (HR) and `nengah` (Race Leader, own R2RE scope only). Password `jfresh123`.

| Page | File |
|---|---|
| 41 screens (full §89 inventory: EXEC-001, FIN-001…006, GOAL-001/002, KPI-001…004, XSCORE-001/002, TEAM-001/002, PERSON-001, RACE-001…004, REFL-001…006, DI-001…005, REPORT-001, plus approvals and audit) | `app/index.html` |
| Phase 5 overview (NP-01 to NP-10, five scores, demo accounts, rules, Definition of Done, visuals) | `phase5/index.html` |
| Screen specifications | `phase5/screens.html` |
| Test cases run in the browser + responsive checklist | `phase5/tests.html` |

Code:

- `assets/js/jfos-perf.js` — `JFPERF`, the one performance engine: Business Health, Financial Health, XScore, Teamwork Score, Personal Score, goal progress, KPI lifecycle and versions, 100% weight validation, R2RE, monthly reflection with normalised weights, insights, decisions and the audit. `install()` joins its permissions, screens and menus to the shared config.
- `assets/js/jfos-perf-data.js` — sample data (no server yet).
- `app/screens-perf.js`, `app/screens-perf2.js`, `app/screens-perf3.js` (NV-02 Financial Health, KPI version history, XScore dimension, alerts, recommendations, approvals, audit), `app/perf.css` — the screens.
- `assets/js/jfos-perf-tests.js` — 80 test cases. Run `node tools/test-perf.js`.
- `assets/js/jfos-perf-docs.js` — data for the Phase 5 pages.
- `assets/brand/phase5/` — reference visuals NV-01 to NV-10.

§81–§97 are built: audit of every change with who, when, old/new value, reason and approval; one approval queue (manual KPI actual, financial adjustment, KPI version, scorecard, reflection, STRACON, decision); data freshness with stale warnings; Personal Score privacy by role, hierarchy, HR grant and team scope; KPI builder per device; R2RE priority order; the six Reflection steps; specific empty and error states.

## Phase 6 — Client & Commercial (NP 1.0)

Sign in as `ayu` (sales / account manager) or `aji` (owner). Finance (`budi`) sees terms, credit, AR and profitability; the supervisor (`saras`) sees properties, services and the SLA clock without pricing or margin; the clients `sari.grandvista` and `nia.hotelabc` see only their own services, contract, SLA and documents. Password `jfresh123`.

| Page | File |
|---|---|
| 29 screens (CLIENT-001…003, PROPERTY-001…003, CONTACT-001/002, SERVICE-001/002, CONTRACT-001…004, RATE-001…003, SLA-001/002, DOC-001, HISTORY-001, RENEW-001/002, APPROVAL-001, COM-ALERT-001, HEALTH-001, OPP-001/002, CLT-COM-001) | `app/index.html` |
| Phase 6 overview (lifecycle, NP-01 to NP-09, demo accounts, §77 rules, §76 Definition of Done, visuals) | `phase6/index.html` |
| Screen specifications (18 §65 fields per screen) | `phase6/screens.html` |
| Test cases run in the browser + responsive checklist | `phase6/tests.html` |

Code:

- `assets/js/jfos-comm.js` — `JFCOMM`, the one commercial engine: clients and properties, contacts with scope and smart recommendation, service catalog vs client configuration, versioned contracts and comparison, Rate Cards with effective dates and historical invoice pricing, SLA rules with precedence and the SLA clock, documents with versions, the commercial timeline and audit, renewals, the approval inbox, alerts, Client Health, profitability, growth, risk and opportunities. AR is read from the Phase 5 ledger, never copied. `install()` joins its permissions, screens and menus to the shared config.
- `assets/js/jfos-comm-data.js` — sample data (Jaens Spa Group with four properties and eleven more clients; no server yet).
- `app/screens-comm.js`, `app/screens-comm2.js`, `app/screens-comm3.js`, `app/comm.css` — the screens.
- `assets/js/jfos-comm-tests.js` — 50 test cases. Run `node tools/test-comm.js`.
- `assets/js/jfos-comm-docs.js` — data for the Phase 6 pages.
- `assets/brand/phase6/` — reference visuals NV-01 to NV-09.

## Phase 9 — Delivery, Client Completion & Service Closure (NP 1.0)

Sign in as `ketut` (driver, phone-first), `nyoman.kayana` (Kayana client, phone), `saras` (supervisor, iPad), `dewi` (operations manager), `budi` (finance), `aji` (owner, read only) or `ayu` (sales). Team 3 `luh` sees the ready queue and receives returns. Password `jfresh123`.

Core rule: Ready ≠ Delivered ≠ Completed ≠ Billing Ready. Each gate is enforced in the engine.

| Page | File |
|---|---|
| REL-001/002 release, DISP-001/002 dispatch, CLIENT-DEL-001, DRV-HO-001 handover, DLV-POD-001/002, REC-001, DLV-ISSUE-001, RETURN-001, REDEL-001, COMP-001, DLV-TIMELINE-001, BILL-001/002, DLV-KPI-001, FEEDBACK-001 | `app/index.html` |
| Phase 9 overview (closure model, three gates, NP-01 to NP-10, demo accounts, §84 rules, §83 Definition of Done, visuals) | `phase9/index.html` |
| Screen specifications (§77 fields per screen) | `phase9/screens.html` |
| Test cases run in the browser + responsive checklist | `phase9/tests.html` |

Code:

- `assets/js/jfos-dlv.js` — `JFDLV`, the one delivery-closure engine: release with 12 checks and controlled override, delivery tasks linked to Phase 7 orders (driver, vehicle, route, ETA, chat and tracking stay in the Phase 7 engine; the trip start is gated on release), handover, POD with immutable amendments, reconciliation with partial acceptance, issues, returns and redelivery chains, Service Completion with frozen versioned data and final SLA, billing validation with the historical rate snapshot and the Finance outbox, client feedback, delivery KPI feeding Phase 5 Ambidex and Phase 6 Client Health. `install()` joins its permissions, screens, menus and roles to the shared config.
- `assets/js/jfos-dlv-data.js` — sample day (2026-10-06): releases, deliveries, PODs, issues, returns, completions, feedback and KPI history.
- `app/screens-dlv.js`, `app/screens-dlv2.js`, `app/screens-dlv3.js`, `app/dlv.css` — the screens (mobile for driver and client, iPad for supervisor, desktop for manager, finance and owner) and the printable Delivery Note, POD, Return Note, Redelivery Note and Completion Summary.
- `assets/js/jfos-dlv-tests.js` — 34 test cases. Run `node tools/test-dlv.js`.
- `assets/js/jfos-dlv-docs.js` — data for the Phase 9 pages.
- `assets/brand/phase9/` — the NV-01 to NV-10 reference sheet sent for Phase 9.

## Phase 8 — Laundry Production (NP 1.0)

Sign in as `putu` (Team 1 · receiving & preparation), `arta` (Team 2 · washing & drying), `luh` (Team 3 · finishing, QC & packing), `oka` (maintenance), `saras` (production supervisor) or `aji` (owner, read only). The driver `ketut` gets "Ambil di Plant" to accept ready packages. Password `jfresh123`.

| Page | File |
|---|---|
| Team homes HOM-T1/T2/T3-001, receiving, weighing, differences, sorting, batch builder, handovers 1–4, washing, drying, finishing, QC, rewash, packing, ready to deliver, issues, history, Command Center, capacity, machines, production issues, batch trace, KPI, CHK-001…005 and MNT-001…006 | `app/index.html` |
| Phase 8 overview (execution model, team workspaces, NP-01 to NP-12, demo accounts, §92 rules, §91 Definition of Done, visuals) | `phase8/index.html` |
| Screen specifications (§86 fields per screen) | `phase8/screens.html` |
| Test cases run in the browser + responsive checklist | `phase8/tests.html` |

Code:

- `assets/js/jfos-prod.js` — `JFPROD`, the one production engine: receiving from Phase 7 manifests, weighing with scale or audited manual override, differences, sorting with tolerance, batch recommendations with capacity validation, two-sided handovers, washing and drying with machine timers, finishing, QC with rework routed to the cause stage, packing with reconciliation and labels, ready to deliver and the driver handover, issues, the live Command Center with bottleneck detection, full batch trace, production KPI feeding Ambidex, the versioned daily checklist engine with approval, and preventive maintenance with SOP checklists, work orders and downtime. `install()` joins its permissions, screens, menus and roles to the shared config.
- `assets/js/jfos-prod-data.js` — sample day (2026-10-06): batches, machines, staff, checklist templates and instances, maintenance plans and work orders (no server or scale yet).
- `app/screens-prod.js`, `app/screens-prod2.js`, `app/screens-prod3.js`, `app/prod.css` — the screens (iPad first, offline banner "Tidak ada koneksi").
- `assets/js/jfos-prod-tests.js` — 60 test cases. Run `node tools/test-prod.js`.
- `assets/js/jfos-prod-docs.js` — data for the Phase 8 pages.
- `assets/brand/phase8/` — the 9 reference visuals sent for Phase 8.

## Phase 7 — Order, Pickup, Delivery & Live Logistics (NP 1.0)

Sign in as `ketut` (driver, phone-first), `saras` (supervisor / dispatcher), `made` (plant receiving operator) or `aji` (owner; the live map asks for a reason first). The clients `sari.grandvista` and `nia.hotelabc` request pickups and track only the driver heading to their own property. Password `jfresh123`.

| Page | File |
|---|---|
| 27 screens (ORDER-001…003, SCHEDULE-001/002, DISPATCH-001, ROUTE-001/002, DRIVER-001, VEHICLE-001, DRIVER-MOB-001…003, MANIFEST-001, BAG-001, EVIDENCE-001, POD-001, ISSUE-001/002, ARRIVAL-001, HANDOVER-001, TRACK-001…003, CHAT-001, TIMELINE-001, LOG-KPI-001) | `app/index.html` |
| Phase 7 overview (execution model, NP-01 to NP-10, location privacy, demo accounts, §92 rules, §91 Definition of Done, visuals) | `phase7/index.html` |
| Screen specifications (§85 fields per screen) | `phase7/screens.html` |
| Test cases run in the browser + responsive checklist | `phase7/tests.html` |

Code:

- `assets/js/jfos-logi.js` — `JFLOG`, the one logistics engine: orders with duplicate check, recurring schedules and auto orders, dispatch lanes and capacity checks, routes, drivers and vehicles, the driver status flow (no jumps), pickup without item count, manifests and bags with scan codes and versions, evidence and POD (never edited, amended with a reason), issues and supervisor decisions, plant arrival and two-sided handover with reconciliation, location only during active trips, ETA with freshness, client tracking scope, the owner reason gate and 30-day access log, task chat, the route timeline and the 12 logistics KPIs that feed the Phase 5 Personal Score. Clients, properties and SLA come from the Phase 6 engine. `install()` joins its permissions, screens, menus and notifications to the shared config.
- `assets/js/jfos-logi-data.js` — sample day (2026-10-06): drivers, vehicles, routes, trips, orders, manifests and simulated positions (no server or GPS yet).
- `app/screens-logi.js`, `app/screens-logi2.js`, `app/screens-logi3.js`, `app/logi.css` — the screens.
- `assets/js/jfos-logi-tests.js` — 44 test cases. Run `node tools/test-logi.js`.
- `assets/js/jfos-logi-docs.js` — data for the Phase 7 pages.
- `assets/brand/phase7/` — reference visuals NV-01 to NV-10.

## Three form factors

Each page changes its layout, not just its size:

| Form factor | Width | Purpose |
|---|---|---|
| PC Report | ≥ 1240 px | Owner, CEO, management. Full diagrams, matrix, swimlane, ERD. |
| Operational iPad | 700–1239 px | Supervisor and floor teams. Large cards, accordions, fewer columns. |
| Mobile | < 700 px | Pickup, driver, alerts. Single column, expandable cards, one main action. |

## Language

Bahasa Indonesia is the default. The ID | EN switch in the top bar swaps every label. It is stored per browser.
In the HTML, the Indonesian text is the element content and the English text is in `data-en`.

## Brand

- Official logo: `assets/brand/jfresh-logo.png`. It is cropped from the uploaded original (`assets/brand/source/jfresh-logo-original.jpeg`), with the circular frame removed and the background set to white. The artwork, ratio and colors are unchanged.
- Never redraw, recolor, stretch or simplify the logo. Place it on white with clear space.
- When a higher-resolution or vector original is available, replace `jfresh-logo.png` with it (same file name) and every page picks it up.

## Design system

Since Phase 3 the tokens live in `assets/css/jfos-tokens.css` (see above): deep blue `#0754A6`, fresh blue `#00A8E8`, orange `#F7931E`, yellow `#FFC72C`, soft background `#F6F9FC`, and green / amber / red used only for status. `assets/css/jfresh.css` maps its older variables onto those tokens and holds the Phase 1/2 page components (panels, tiles, flows, chains, chips, buttons, KPI tiles, accordions).
`assets/js/icons.js` is the single icon set. `assets/js/jfresh.js` renders the top bar, pager, language switch, responsive accordions and the SVG diagrams.
