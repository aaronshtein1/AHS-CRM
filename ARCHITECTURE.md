# Patient CRM Architecture

## Overview

This Patient CRM is a standalone, production-ready web application for managing patient leads. The core entity is a **Patient (Person)** with related data displayed in a tabbed profile interface. **Stages/Processes are separate entities** that get assigned to patients, enabling workflow tracking independent of patient data.

## Tech Stack Decision

### Backend: Node.js + NestJS + Prisma + PostgreSQL
**Justification:**
- **NestJS**: Provides excellent structure for enterprise applications with built-in dependency injection, modular architecture, and decorators for validation/auth
- **Prisma**: Type-safe ORM with excellent migrations, generates TypeScript types from schema
- **PostgreSQL**: Robust, supports JSON fields for flexible data, excellent for relational data with complex joins
- **TypeScript**: End-to-end type safety between frontend and backend

### Frontend: Next.js + React + TypeScript + Tailwind CSS
**Justification:**
- **Next.js**: Server-side rendering, API routes, file-based routing, excellent DX
- **Tailwind CSS**: Rapid UI development with utility classes
- **React Query**: Server state management with caching and background updates

### Job Queue: BullMQ + Redis
**Justification:**
- **BullMQ**: Mature, reliable job queue with scheduling, retries, rate limiting
- **Redis**: Required for BullMQ, also useful for session storage and caching
- Supports cron-like scheduling for automation engine

### Infrastructure: Docker Compose
- Single `docker-compose.yml` for local dev: app, db, redis
- Production-ready configuration

---

## Database Schema

### Core Entities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS & AUTH                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ User                                                                         │
│   - id (UUID, PK)                                                           │
│   - email (unique)                                                          │
│   - passwordHash                                                            │
│   - firstName, lastName                                                     │
│   - role: ADMIN | REP                                                       │
│   - isActive                                                                │
│   - createdAt, updatedAt                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              PATIENT (CORE)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Patient                                                                      │
│   - id (UUID, PK)                                                           │
│   - firstName, middleName, lastName                                         │
│   - dateOfBirth                                                             │
│   - gender                                                                  │
│   - preferredLanguage (default: 'en')                                       │
│   - ssn (encrypted, optional)                                               │
│   - notes (text)                                                            │
│   - status: ACTIVE | INACTIVE | DECEASED                                    │
│   - ownerId (FK -> User) - assigned rep                                     │
│   - createdById (FK -> User)                                                │
│   - createdAt, updatedAt                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PatientContact                                                               │
│   - id (UUID, PK)                                                           │
│   - patientId (FK -> Patient)                                               │
│   - type: PHONE | EMAIL                                                     │
│   - value (phone number or email)                                           │
│   - label: HOME | WORK | MOBILE | OTHER                                     │
│   - isPrimary                                                               │
│   - canContact (consent flag)                                               │
│   - canText (for phones)                                                    │
│   - doNotContact                                                            │
│   - verifiedAt                                                              │
│   - createdAt, updatedAt                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Address                                                                      │
│   - id (UUID, PK)                                                           │
│   - patientId (FK -> Patient)                                               │
│   - type: HOME | MAILING | TEMPORARY | OTHER                                │
│   - street1, street2                                                        │
│   - city, state, zipCode, county                                            │
│   - isPrimary                                                               │
│   - effectiveFrom, effectiveTo                                              │
│   - createdAt, updatedAt                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ EmergencyContact                                                             │
│   - id (UUID, PK)                                                           │
│   - patientId (FK -> Patient)                                               │
│   - firstName, lastName                                                     │
│   - relationship                                                            │
│   - phone, email                                                            │
│   - isPrimary                                                               │
│   - notes                                                                   │
│   - createdAt, updatedAt                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ InsurancePolicy                                                              │
│   - id (UUID, PK)                                                           │
│   - patientId (FK -> Patient)                                               │
│   - type: MEDICAID | MEDICARE | COMMERCIAL | OTHER                          │
│   - payerName                                                               │
│   - memberId (Medicaid ID, etc.)                                            │
│   - groupNumber                                                             │
│   - cin (Medicaid CIN if applicable)                                        │
│   - planName                                                                │
│   - effectiveDate, terminationDate                                          │
│   - isPrimary                                                               │
│   - verificationStatus: PENDING | VERIFIED | FAILED                         │
│   - verifiedAt, verifiedById                                                │
│   - notes                                                                   │
│   - createdAt, updatedAt                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ MedicalInfo                                                                  │
│   - id (UUID, PK)                                                           │
│   - patientId (FK -> Patient, unique - 1:1)                                 │
│   - pcpName (Primary Care Physician)                                        │
│   - pcpPhone, pcpFax, pcpAddress                                            │
│   - pcpNpi                                                                  │
│   - diagnoses (JSON array of {code, description, date})                     │
│   - allergies (JSON array)                                                  │
│   - medications (JSON array)                                                │
│   - notes (free text)                                                       │
│   - createdAt, updatedAt                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          PROCESS TEMPLATES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ProcessTemplate                                                              │
│   - id (UUID, PK)                                                           │
│   - name                                                                    │
│   - description                                                             │
│   - isActive                                                                │
│   - defaultDueDays (overall process SLA)                                    │
│   - createdById (FK -> User)                                                │
│   - createdAt, updatedAt                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ProcessStageTemplate                                                         │
│   - id (UUID, PK)                                                           │
│   - processTemplateId (FK -> ProcessTemplate)                               │
│   - name                                                                    │
│   - description                                                             │
│   - order (sequence number)                                                 │
│   - dueDays (SLA for this stage)                                            │
│   - isFinalStage                                                            │
│   - outcomeType: WON | LOST | NONE (for final stages)                       │
│   - requiredFields (JSON array of field names)                              │
│   - checklist (JSON array of {item, required})                              │
│   - allowedNextStages (JSON array of stage IDs for branching)               │
│   - createdAt, updatedAt                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          PROCESS INSTANCES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ProcessInstance                                                              │
│   - id (UUID, PK)                                                           │
│   - patientId (FK -> Patient)                                               │
│   - processTemplateId (FK -> ProcessTemplate)                               │
│   - assignedToId (FK -> User)                                               │
│   - status: ACTIVE | COMPLETED | CANCELLED | ON_HOLD                        │
│   - outcome: WON | LOST | NULL                                              │
│   - currentStageId (FK -> ProcessStageInstance)                             │
│   - startedAt                                                               │
│   - dueAt                                                                   │
│   - completedAt                                                             │
│   - reopenedFromId (FK -> ProcessInstance, for audit trail)                 │
│   - reopenCount                                                             │
│   - notes                                                                   │
│   - createdById (FK -> User)                                                │
│   - createdAt, updatedAt                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ProcessStageInstance                                                         │
│   - id (UUID, PK)                                                           │
│   - processInstanceId (FK -> ProcessInstance)                               │
│   - stageTemplateId (FK -> ProcessStageTemplate)                            │
│   - status: PENDING | ACTIVE | COMPLETED | SKIPPED                          │
│   - enteredAt                                                               │
│   - dueAt                                                                   │
│   - completedAt                                                             │
│   - completedById (FK -> User)                                              │
│   - checklistStatus (JSON: {itemId: boolean})                               │
│   - notes                                                                   │
│   - createdAt, updatedAt                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ StageTransition (Audit Log)                                                  │
│   - id (UUID, PK)                                                           │
│   - processInstanceId (FK -> ProcessInstance)                               │
│   - fromStageId (FK -> ProcessStageInstance, nullable)                      │
│   - toStageId (FK -> ProcessStageInstance)                                  │
│   - performedById (FK -> User)                                              │
│   - reason                                                                  │
│   - metadata (JSON)                                                         │
│   - createdAt                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              UPDATES (TIMELINE)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Update                                                                       │
│   - id (UUID, PK)                                                           │
│   - patientId (FK -> Patient)                                               │
│   - processInstanceId (FK -> ProcessInstance, optional)                     │
│   - stageInstanceId (FK -> ProcessStageInstance, optional)                  │
│   - communicationId (FK -> Communication, optional)                         │
│   - type: MANUAL | SYSTEM | COMMUNICATION | ASSIGNMENT | STAGE_CHANGE       │
│   - content (text)                                                          │
│   - metadata (JSON for structured data)                                     │
│   - createdById (FK -> User)                                                │
│   - isRedacted                                                              │
│   - redactedAt, redactedById, redactionReason                               │
│   - createdAt (append-only, no updatedAt)                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            COMMUNICATIONS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Communication                                                                │
│   - id (UUID, PK)                                                           │
│   - patientId (FK -> Patient)                                               │
│   - processInstanceId (FK -> ProcessInstance, optional)                     │
│   - type: EMAIL | SMS                                                       │
│   - direction: OUTBOUND | INBOUND                                           │
│   - status: PENDING | SENT | DELIVERED | FAILED | BOUNCED | REPLIED         │
│   - toAddress (email or phone)                                              │
│   - fromAddress                                                             │
│   - subject (for email)                                                     │
│   - body                                                                    │
│   - templateId (reference to message template if used)                      │
│   - providerId (external ID from SendGrid/Twilio)                           │
│   - providerResponse (JSON)                                                 │
│   - sentAt                                                                  │
│   - deliveredAt                                                             │
│   - failedAt, failureReason                                                 │
│   - scheduledFor                                                            │
│   - createdById (FK -> User)                                                │
│   - createdAt, updatedAt                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ MessageTemplate                                                              │
│   - id (UUID, PK)                                                           │
│   - name                                                                    │
│   - type: EMAIL | SMS                                                       │
│   - subject (for email)                                                     │
│   - body (with {{variable}} placeholders)                                   │
│   - isActive                                                                │
│   - createdAt, updatedAt                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              AUTOMATION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ AutomationRule                                                               │
│   - id (UUID, PK)                                                           │
│   - processTemplateId (FK -> ProcessTemplate)                               │
│   - name                                                                    │
│   - description                                                             │
│   - triggerType: STAGE_ENTERED | STAGE_OVERDUE | PROCESS_CREATED |          │
│                  PATIENT_ASSIGNED | MANUAL                                  │
│   - triggerStageId (FK -> ProcessStageTemplate, optional)                   │
│   - delayMinutes (wait before executing)                                    │
│   - conditions (JSON: checks like hasEmail, hasPhone, consent, etc.)        │
│   - actions (JSON array: [{type, config}])                                  │
│   - isActive                                                                │
│   - order (execution priority)                                              │
│   - createdAt, updatedAt                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ScheduledJob                                                                 │
│   - id (UUID, PK)                                                           │
│   - automationRuleId (FK -> AutomationRule)                                 │
│   - patientId (FK -> Patient)                                               │
│   - processInstanceId (FK -> ProcessInstance, optional)                     │
│   - stageInstanceId (FK -> ProcessStageInstance, optional)                  │
│   - status: PENDING | PROCESSING | COMPLETED | FAILED | CANCELLED           │
│   - scheduledFor                                                            │
│   - startedAt                                                               │
│   - completedAt                                                             │
│   - attempts                                                                │
│   - lastError                                                               │
│   - idempotencyKey (unique, for dedup)                                      │
│   - createdAt, updatedAt                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                TASKS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Task                                                                         │
│   - id (UUID, PK)                                                           │
│   - patientId (FK -> Patient)                                               │
│   - processInstanceId (FK -> ProcessInstance, optional)                     │
│   - assignedToId (FK -> User)                                               │
│   - title                                                                   │
│   - description                                                             │
│   - dueAt                                                                   │
│   - priority: LOW | NORMAL | HIGH | URGENT                                  │
│   - status: OPEN | IN_PROGRESS | COMPLETED | CANCELLED                      │
│   - completedAt, completedById                                              │
│   - createdById (FK -> User)                                                │
│   - createdAt, updatedAt                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              AUDIT LOG                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ AuditLog                                                                     │
│   - id (UUID, PK)                                                           │
│   - entityType (Patient, ProcessInstance, etc.)                             │
│   - entityId                                                                │
│   - action: CREATE | UPDATE | DELETE | ASSIGN | STAGE_CHANGE                │
│   - userId (FK -> User)                                                     │
│   - previousData (JSON)                                                     │
│   - newData (JSON)                                                          │
│   - ipAddress                                                               │
│   - userAgent                                                               │
│   - createdAt                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Process Reopening Design Decision

**Chosen Approach: Create New Instance with Link to Previous**

When a process is "reopened" (e.g., patient returns after 2 years), we create a **new ProcessInstance** with a `reopenedFromId` linking to the original. This is the safer, audit-friendly approach.

**Tradeoffs:**

| Approach | Pros | Cons |
|----------|------|------|
| **New Instance (Chosen)** | Full audit trail, original data preserved, clear timeline, no accidental overwrites | More records in DB, need UI to show "reopened from" relationship |
| **Reactivate Original** | Single record, simpler queries | Loss of original completion data, confusing timeline, audit gaps |

The new instance approach ensures:
- Original process data is immutable (completed date, stages, notes)
- Clear audit trail showing the process was reopened
- `reopenCount` on new instance tracks how many times reopened
- UI can show process history chain

---

## API Routes

### Authentication
```
POST   /api/auth/login          - Login with email/password
POST   /api/auth/logout         - Logout (clear session)
GET    /api/auth/me             - Get current user
POST   /api/auth/refresh        - Refresh token
```

### Users (Admin only)
```
GET    /api/users               - List users
POST   /api/users               - Create user
GET    /api/users/:id           - Get user
PATCH  /api/users/:id           - Update user
DELETE /api/users/:id           - Deactivate user
```

### Patients
```
GET    /api/patients            - List patients (with search, filters, pagination)
POST   /api/patients            - Create patient
GET    /api/patients/:id        - Get patient with all related data
PATCH  /api/patients/:id        - Update patient
DELETE /api/patients/:id        - Soft delete patient
POST   /api/patients/:id/assign - Assign patient to rep
POST   /api/patients/bulk-assign - Bulk assign patients (Admin)
```

### Patient Related Entities
```
# Contacts
GET    /api/patients/:id/contacts
POST   /api/patients/:id/contacts
PATCH  /api/patients/:id/contacts/:contactId
DELETE /api/patients/:id/contacts/:contactId

# Addresses
GET    /api/patients/:id/addresses
POST   /api/patients/:id/addresses
PATCH  /api/patients/:id/addresses/:addressId
DELETE /api/patients/:id/addresses/:addressId

# Emergency Contacts
GET    /api/patients/:id/emergency-contacts
POST   /api/patients/:id/emergency-contacts
PATCH  /api/patients/:id/emergency-contacts/:ecId
DELETE /api/patients/:id/emergency-contacts/:ecId

# Insurance
GET    /api/patients/:id/insurance
POST   /api/patients/:id/insurance
PATCH  /api/patients/:id/insurance/:policyId
DELETE /api/patients/:id/insurance/:policyId

# Medical Info (1:1)
GET    /api/patients/:id/medical
PUT    /api/patients/:id/medical
```

### Updates (Timeline)
```
GET    /api/patients/:id/updates     - Get patient timeline (with filters)
POST   /api/patients/:id/updates     - Create manual update
PATCH  /api/updates/:id/redact       - Redact update (Admin only)
```

### Process Templates (Admin)
```
GET    /api/process-templates           - List templates
POST   /api/process-templates           - Create template
GET    /api/process-templates/:id       - Get template with stages
PATCH  /api/process-templates/:id       - Update template
DELETE /api/process-templates/:id       - Deactivate template

# Stage Templates
POST   /api/process-templates/:id/stages
PATCH  /api/process-templates/:id/stages/:stageId
DELETE /api/process-templates/:id/stages/:stageId
POST   /api/process-templates/:id/stages/reorder
```

### Process Instances
```
GET    /api/patients/:id/processes           - List patient's process instances
POST   /api/patients/:id/processes           - Start new process for patient
GET    /api/process-instances/:id            - Get process instance details
PATCH  /api/process-instances/:id            - Update process (notes, assignee)
POST   /api/process-instances/:id/cancel     - Cancel process
POST   /api/process-instances/:id/hold       - Put on hold
POST   /api/process-instances/:id/resume     - Resume from hold
POST   /api/process-instances/:id/reopen     - Reopen (creates new instance)

# Stage Actions
POST   /api/process-instances/:id/stages/:stageId/enter     - Enter stage
POST   /api/process-instances/:id/stages/:stageId/complete  - Complete stage
PATCH  /api/process-instances/:id/stages/:stageId           - Update checklist/notes
```

### Automation Rules (Admin)
```
GET    /api/process-templates/:id/automations
POST   /api/process-templates/:id/automations
PATCH  /api/automation-rules/:id
DELETE /api/automation-rules/:id
POST   /api/automation-rules/:id/test        - Test rule with sample data
```

### Communications
```
GET    /api/patients/:id/communications      - List patient communications
POST   /api/communications/send-email        - Send email
POST   /api/communications/send-sms          - Send SMS
GET    /api/communications/:id               - Get communication details
```

### Tasks
```
GET    /api/tasks                    - List tasks (my tasks, all if admin)
POST   /api/tasks                    - Create task
GET    /api/tasks/:id                - Get task
PATCH  /api/tasks/:id                - Update task
POST   /api/tasks/:id/complete       - Complete task
```

### Work Queue / Dashboard
```
GET    /api/dashboard/my-patients           - Rep's assigned patients
GET    /api/dashboard/my-processes          - Rep's active processes
GET    /api/dashboard/due-today             - Stages due today
GET    /api/dashboard/overdue               - Overdue stages
GET    /api/dashboard/stats                 - Summary stats
GET    /api/dashboard/recent-activity       - Recent updates across patients
```

### Message Templates
```
GET    /api/message-templates
POST   /api/message-templates
PATCH  /api/message-templates/:id
DELETE /api/message-templates/:id
```

---

## UI Routes (Next.js Pages)

```
/                           - Redirect to /dashboard or /login
/login                      - Login page
/dashboard                  - Work queue dashboard (My patients, due stages, etc.)

/patients                   - Patient list with search/filters
/patients/new               - Create new patient
/patients/[id]              - Patient profile (tabbed view)
  ?tab=demographics         - Demographics tab (default)
  ?tab=contact              - Contact information
  ?tab=addresses            - Addresses
  ?tab=emergency            - Emergency contacts
  ?tab=insurance            - Insurance/Medicaid + Medical
  ?tab=medical              - PCP/Diagnosis
  ?tab=updates              - Timeline/Updates
  ?tab=processes            - Stages/Processes

/processes/[id]             - Process instance detail view

/admin/users                - User management (Admin)
/admin/templates            - Process template management (Admin)
/admin/templates/[id]       - Template detail with stages & automations
/admin/templates/new        - Create new template
/admin/message-templates    - Message template management
```

---

## Automation Engine Design

### Architecture
```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   NestJS App     │────▶│     Redis        │◀────│   Worker         │
│   (API Server)   │     │   (BullMQ)       │     │  (Processor)     │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                                                  │
        └──────────────────────────────────────────────────┘
                           PostgreSQL
```

### Job Types
1. **Scheduled Actions** - Jobs scheduled for future execution (delayed sends)
2. **Trigger Evaluations** - Evaluate rules when events occur
3. **Recurring Checks** - Cron jobs for overdue detection

### Idempotency
- Each job has an `idempotencyKey` (e.g., `rule_123_patient_456_stage_789`)
- Before execution, check if action already completed
- Use database transaction to mark complete + execute action

### Quiet Hours
- Store user timezone preference
- Define quiet hours (e.g., 9 PM - 8 AM)
- Reschedule jobs that fall in quiet hours to next available window

### Trigger Flow
```
Event Occurs (e.g., Stage Entered)
         │
         ▼
Find Matching AutomationRules
         │
         ▼
For Each Rule:
  - Evaluate Conditions (hasEmail, consent, etc.)
  - If Pass: Create ScheduledJob
         │
         ▼
BullMQ Worker Picks Up Job
         │
         ▼
Execute Actions:
  - Send Email/SMS (via provider)
  - Create Task
  - Add Update
  - Notify Rep
         │
         ▼
Mark Job Complete, Log Result
```

---

## Security Considerations

1. **Authentication**: JWT with HTTP-only cookies, refresh token rotation
2. **Password**: bcrypt hashing with salt rounds = 12
3. **RBAC**: Middleware checks role + ownership before data access
4. **Rate Limiting**: Login endpoint (5 attempts/minute), API (100 req/minute)
5. **Input Validation**: class-validator decorators on all DTOs
6. **SQL Injection**: Prisma parameterized queries
7. **XSS**: React auto-escapes, CSP headers
8. **CSRF**: SameSite cookies + CSRF token for mutations
9. **Audit Logging**: All sensitive actions logged with user, timestamp, IP

---

## Example Process Template: Medicaid Eligibility + Intake

### Stages
1. **New Lead** (order: 1, dueDays: 1)
   - Checklist: [ ] Verify contact info, [ ] Initial assessment

2. **Contact Attempt 1** (order: 2, dueDays: 2)
   - Checklist: [ ] Call made, [ ] Voicemail left if no answer
   - Automation: On enter, send SMS + Email

3. **Eligibility Verification** (order: 3, dueDays: 5)
   - Checklist: [ ] Medicaid ID verified, [ ] Coverage dates confirmed
   - Required fields: medicaidId

4. **PCP/Orders Needed** (order: 4, dueDays: 7)
   - Checklist: [ ] PCP identified, [ ] Orders requested

5. **Ready to Schedule SOC** (order: 5, dueDays: 3)
   - Checklist: [ ] All documents received, [ ] Schedule confirmed

6. **Closed/Won** (order: 6, isFinal: true, outcome: WON)

7. **Closed/Lost** (order: 7, isFinal: true, outcome: LOST)

### Automation Rules
1. **Contact Attempt SMS** - Trigger: STAGE_ENTERED (Contact Attempt 1), Action: Send SMS
2. **Contact Attempt Email** - Trigger: STAGE_ENTERED (Contact Attempt 1), Action: Send Email
3. **Overdue Follow-up** - Trigger: STAGE_OVERDUE (Contact Attempt 1, 48h), Actions: Notify Rep, Send Follow-up SMS

---

## Project Structure

```
/home/user/AHS-CRM/
├── docker-compose.yml
├── .env.example
├── README.md
├── ARCHITECTURE.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── common/
│       │   ├── decorators/
│       │   ├── guards/
│       │   ├── filters/
│       │   ├── interceptors/
│       │   └── pipes/
│       ├── auth/
│       ├── users/
│       ├── patients/
│       ├── processes/
│       ├── updates/
│       ├── communications/
│       ├── tasks/
│       ├── automation/
│       └── providers/
│           ├── email/
│           └── sms/
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── login/
│       │   ├── dashboard/
│       │   ├── patients/
│       │   ├── processes/
│       │   └── admin/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── types/
└── worker/
    └── (integrated in backend with BullMQ)
```
