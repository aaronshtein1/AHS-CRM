# Patient CRM

A production-ready Patient CRM web application for managing patient leads. The core entity is a **Patient (Person)** displayed as a patient profile with tabs (Demographics, Contact, Addresses, Emergency Contacts, Insurance/Medicaid, Medical/PCP, Updates, Stages/Processes).

## Features

### Patient Management
- **Patient Profiles**: Comprehensive patient records with tabbed interface
- **Demographics**: Name, DOB, gender, language preference, notes
- **Contact Information**: Multiple phones/emails with consent flags
- **Addresses**: Multiple addresses with effective dates
- **Emergency Contacts**: Family/emergency contact management
- **Insurance/Medicaid**: Policy tracking with verification status
- **Medical Info**: PCP details, diagnoses (ICD codes), allergies, medications

### Process/Stage Workflow
- **Process Templates**: Reusable workflow definitions with stages
- **Stage Management**: Ordered stages with checklists, due dates, SLAs
- **Process Instances**: Track patient progress through workflows
- **Stage Transitions**: Audit-logged stage progression
- **Process Reopening**: Create new instances linked to previous (audit-friendly)

### Timeline & Updates
- **Chronological History**: All patient activity in one timeline
- **Update Types**: Manual notes, system events, communications, stage changes
- **Redaction Support**: Admin can redact sensitive updates with audit trail

### Assignment & Work Queues
- **Patient Ownership**: Each patient has an assigned rep
- **Process Assignment**: Process instances can have different assignees
- **Dashboard**: Due today, overdue stages, recent activity
- **Task Management**: Create and track tasks for patients

### Automation Engine
- **Triggers**: Stage entered, stage overdue, process created, patient assigned
- **Actions**: Send email/SMS, create task, add update, notify rep
- **Conditions**: Check for email/phone availability, consent flags
- **Scheduling**: Delayed execution, quiet hours support
- **Idempotency**: Prevents duplicate actions on retries

### Security & RBAC
- **Role-Based Access**: Admin and Rep roles
- **JWT Authentication**: Secure token-based auth with HTTP-only cookies
- **RBAC Enforcement**: Reps can only access assigned patients
- **Audit Logging**: Track all sensitive operations

## Tech Stack

- **Backend**: Node.js + NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js + React + TypeScript + Tailwind CSS
- **Job Queue**: BullMQ + Redis
- **Authentication**: JWT with Passport.js
- **API Documentation**: Swagger/OpenAPI

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd AHS-CRM
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Start all services:
```bash
docker compose up -d
```

4. Run database migrations and seed:
```bash
docker compose exec backend npx prisma migrate dev
docker compose exec backend npm run prisma:seed
```

5. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

### Login Credentials
```
Admin: admin@patientcrm.com / admin123
Rep: rep@patientcrm.com / rep123
```

### Local Development (Without Docker)

#### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

#### Backend Setup
```bash
cd backend
cp .env.example .env
# Update DATABASE_URL in .env with your PostgreSQL connection string
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

#### Frontend Setup
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## Configuration

### Environment Variables

#### Database
```
DATABASE_URL=postgresql://user:password@localhost:5432/patient_crm
```

#### Redis (for job queue)
```
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### JWT Authentication
```
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1d
```

#### Email (SMTP)
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

#### SMS (Twilio)
```
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Adding a New Process Template

### Via API

```bash
# Create template
curl -X POST http://localhost:4000/api/process-templates \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Patient Onboarding",
    "description": "Standard onboarding process",
    "defaultDueDays": 14
  }'

# Add stages
curl -X POST http://localhost:4000/api/process-templates/<template-id>/stages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Initial Contact",
    "order": 1,
    "dueDays": 2,
    "checklist": [{"item": "Call patient", "required": true}]
  }'
```

### Via Admin UI

1. Login as admin
2. Navigate to Admin > Templates
3. Click "New Template"
4. Add stages and configure automation rules

## Example Process Template

The seed data includes a **"Medicaid Eligibility + Intake"** template with these stages:

1. **New Lead** (1 day SLA)
   - Verify contact info
   - Initial assessment

2. **Contact Attempt 1** (2 day SLA)
   - Call made
   - Voicemail left if no answer
   - *Automation: Send SMS/Email on stage enter*

3. **Eligibility Verification** (5 day SLA)
   - Medicaid ID verified
   - Coverage dates confirmed

4. **PCP/Orders Needed** (7 day SLA)
   - PCP identified
   - Orders requested

5. **Ready to Schedule SOC** (3 day SLA)
   - All documents received
   - Schedule confirmed

6. **Closed/Won** (Final - Success)

7. **Closed/Lost** (Final - Failure)

### Automation Examples

- **Contact Attempt SMS**: Sends SMS when entering "Contact Attempt 1"
- **Contact Attempt Email**: Sends email when entering "Contact Attempt 1"
- **Overdue Follow-up**: When stage is overdue, notifies rep and sends follow-up SMS

## API Documentation

Full API documentation is available at `/api/docs` when the backend is running.

### Key Endpoints

```
# Authentication
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

# Patients
GET    /api/patients
POST   /api/patients
GET    /api/patients/:id
PATCH  /api/patients/:id
POST   /api/patients/:id/assign

# Process Templates (Admin)
GET    /api/process-templates
POST   /api/process-templates
POST   /api/process-templates/:id/stages

# Process Instances
POST   /api/patients/:id/processes
GET    /api/process-instances/:id
POST   /api/process-instances/:id/stages/:stageId/advance

# Dashboard
GET    /api/dashboard/stats
GET    /api/dashboard/my-patients
GET    /api/dashboard/due-today
GET    /api/dashboard/overdue
```

## Project Structure

```
AHS-CRM/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Seed data
│   └── src/
│       ├── auth/              # Authentication module
│       ├── users/             # User management
│       ├── patients/          # Patient CRUD
│       ├── processes/         # Process templates & instances
│       ├── updates/           # Timeline/updates
│       ├── communications/    # Email/SMS providers
│       ├── tasks/             # Task management
│       ├── automation/        # Automation engine
│       └── dashboard/         # Work queue APIs
├── frontend/
│   └── src/
│       ├── app/               # Next.js pages
│       ├── components/        # React components
│       ├── lib/               # API client, stores
│       └── types/             # TypeScript types
├── docker-compose.yml
└── README.md
```

## Development

### Running Tests
```bash
cd backend
npm test
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name <migration-name>
```

### Prisma Studio (Database GUI)
```bash
cd backend
npx prisma studio
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production database
4. Set up SSL/TLS
5. Configure rate limiting
6. Set up monitoring/logging

### Docker Production Build
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## License

Private - All Rights Reserved
