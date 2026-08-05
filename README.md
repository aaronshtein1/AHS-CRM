# Intake CRM — Frontend Client Portal

A modern, responsive Next.js web application designed for home health care agencies, community programs, and CDPAP onboarding teams to manage patient leads through their entire intake lifecycle.

---

## 🚀 Key Features

* **Drag-and-Drop Kanban Board:** Powered by `@dnd-kit` and Framer Motion for smooth, visual tracking of patient leads from `NEW` to `ACTIVE_PATIENT` to `DISCHARGED`.
* **6-Tab Patient Profile Workspace:**
  1. **Contact & Demographics:** Demographic info, secondary contacts, and referral source tracking.
  2. **Insurance & Payers:** Verification fields for Medicaid, Medicare, and private plans.
  3. **Medical Profile:** Diagnoses (ICD codes), approved weekly hours, and primary physician details.
  4. **Active Processes:** Live checklist workflow trackers for complex onboarding steps (e.g. CDPAP enrollment).
  5. **Task Manager:** Case-specific tasks categorized by priority (LOW to URGENT) and due date.
  6. **Interactive Timeline:** A comprehensive, chronological feed showing system audits, call outcomes, and manual user updates.
* **Performance Dashboard:** Visual metrics tracking conversion funnels, task deadlines, recent activities, and coordinator workloads.
* **Secure JWT Session Control:** Cookie-based route guards and customized client-side layout rendering depending on user authorization roles (`ADMIN`, `COORDINATOR`, `REP`).

---

## 🛠️ Tech Stack

* **Core:** [Next.js 14](https://nextjs.org/) (App Router, TypeScript-first)
* **Styling:** Tailwind CSS & custom variables (harmonious palettes, sleek modern headers)
* **Animations:** Framer Motion (transitions, draggable card lists)
* **Icons:** Lucide React
* **Drag-and-Drop Engine:** `@dnd-kit` (Core, Sortable, Utilities)

---

## 💻 Local Development Setup

### Prerequisites
Make sure you have Node.js (v18+) installed on your machine.

### 1. Install Dependencies
Navigate to the root directory and install npm packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```
*(Point this to your running backend API server)*

### 3. Run Development Server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

---

## 🏗️ Production Build
To generate a compiled production bundle:
```bash
npm run build
npm run start
```
This application is fully optimized for containerization and serverless deployments on platforms like **Vercel** or **Netlify**.
