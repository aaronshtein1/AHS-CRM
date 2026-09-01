# 🔒 RELEASE & VERSION CONTROL POLICY — Intake CRM

This document defines the Version Control Architecture, Branching Strategy, and Weekly Release Batching Policy for the **AHS Intake CRM Application**.

---

## 1. Branching Strategy & Roles

- **`main` (Production Branch)**:
  - **LOCKED & STABLE**. Represents the live production application deployed to `https://ahs-crm.vercel.app`.
  - Direct commits to `main` are strictly prohibited outside of emergency hotfixes.
  - All deployments to `main` must be tagged with a Semantic Version tag (e.g., `v2.0.0-GA`, `v2.1.0`).

- **`develop` (Integration & Weekly Staging Branch)**:
  - Active integration branch where all weekly feature additions, bug fixes, and intake updates accumulate.
  - Deployed to the internal staging environment for pre-release validation.

- **`feature/*` (Feature Development Branches)**:
  - Short-lived branches created off `develop` for specific user stories, API additions, or UI refactors.
  - Must pass full Playwright E2E verification before merging back to `develop`.

---

## 2. Weekly Release Batching Cadence

To ensure system stability, avoid ad-hoc regression risk, and preserve operational data integrity, code changes are released on a **Weekly Release Cadence**:

| Milestone | Schedule / SLA | Action |
| :--- | :--- | :--- |
| **Development Window** | Monday 09:00 EST – Thursday 17:00 EST | Daily features & enhancements committed to `develop`. |
| **Code Freeze & Candidate Tag** | Friday 12:00 EST | Freeze `develop` branch; generate Release Candidate tag (e.g. `v2.1.0-RC1`). |
| **E2E & DOM Verification** | Friday 14:00 EST | Run full Playwright test suite (`npx playwright test`). Verify 100% pass rate. |
| **Production Release & Tag** | Friday 17:00 EST | Merge `develop` to `main`, apply release tag `v2.1.0`, and trigger production deploy. |

---

## 3. Emergency Hotfix Procedure

If a critical blocker or production issue arises outside the weekly release window:
1. Create a `hotfix/vX.Y.Z` branch directly off `main`.
2. Apply minimal required code fix and run targeted Playwright regression test.
3. Merge back into `main` and `develop`, tag release (e.g., `v2.0.1`), and deploy immediately.

---

## 4. Current Repository Status

- **Baseline Version**: `v2.0.0-GA`
- **Active Production URL**: `https://ahs-crm.vercel.app`
- **Locked Git Commit Tag**: `v2.0.0-GA`
