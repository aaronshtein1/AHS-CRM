# 📜 CHANGELOG — Intake CRM Frontend

All notable changes to the AHS Intake CRM application will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0-GA] - 2026-09-01 (Locked Baseline Release)

### 🚀 Added
- **33 Active Operational Leads Ingestion**:
  - Ingested 33 active NHTD & TBI operational leads directly from `33_active_nhtd_tbi_intake_leads_blocker_tracker_UPDATED_AUG28.xlsx`.
  - Assigned 100% of operational leads to **Jeffrey Mendoza** (`jmendoza@homecare4all.org`, Role: ADMIN / Intake Manager).
  - Populated complete operational context, blocker types, counties, and historical updates.

- **Intelligent Tasking & Risk Calculation Engine**:
  - Implemented `runIntelligentTaskingEngine(leads)` calculating dynamic risk scores (0–100) based on age weights, overdue checkbacks, stage stalls (`ON_HOLD`), and blocker severity.
  - Auto-generated 33 Intelligent Tasks assigned to Jeffrey Mendoza and synced across local state, lead detail views, global task tables, and dashboard widgets.

- **Strict Service Type & Referral Source Architecture**:
  - Forced `serviceType: 'NHTD & TBI'` across all 33 operational leads.
  - Mapped referral sources strictly to standardized options (`NHTD Service Coordinator`, `HCSS Agency Transfer`).
  - Separated Service Coordinator company / agency names into dedicated `serviceCoordinator` field (`A&T Healthcare`, `VNHC`, `My Independence`, `Upstate Advocacy`, `Unlimited Care, Inc.`, `Fort Hudson`, `Kigi Services`, `Prompt`, `Epilepsy Center`, `Living Resources`, `Empire Community Services`).

- **NHTD / TBI Waiver Intake Workflow Staging**:
  - Attached active `NHTD / TBI Waiver Intake Workflow` process instances to every lead profile.
  - Tracked multi-stage progression: `Referral Intake` → `Initial Screening & Paperwork` → `Service Plan & Abstract (ISP)` → `RRDC Approval & NOD` → `Start of Care (SOC)`.

- **State Persistence Safeguard**:
  - Updated `getLeads()` to initialize from `mockState.leads` first, preserving user edits, manual notes, status changes, and blocker updates across page reloads and API calls.

- **Playwright Automated E2E Verification Suite**:
  - Created automated Playwright test scripts (`tests/test_jeffrey_dom.spec.ts`, `tests/test_intelligent_tasks_and_user_mgmt.spec.ts`) validating live DOM rendering, task generation, and UI state.

---

## [1.0.0] - 2026-08-15 (Initial Prototype)
- Baseline Next.js 14 CRM layout with standard HHA/PCA intake pipelines, login screens, and mock data.
