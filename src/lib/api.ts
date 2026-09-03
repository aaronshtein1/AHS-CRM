// Comprehensive API client with live Neon Postgres backend integration, RingCentral Sync, Process Engine Fallback & Persistent Local Storage Precedence
import { ringCentralService, normalizePhone } from './ringcentral';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'https://intake-crm-dusky.vercel.app');

interface FetchOptions extends RequestInit {
  token?: string;
}

export interface TimelineUpdate {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  createdBy: { firstName: string; lastName: string } | null;
  leadId?: string;
}

export interface LeadItem {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string;
  stage: string;
  status: string;
  source: string;
  serviceType: string;
  county: string;
  payerType: string;
  totalCallAttempts: number;
  owner: { firstName: string; lastName: string } | null;
  blockerType: string | null;
  blockerNotes: string | null;
  riskLevel: string;
  riskScore: number;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  checkbackDate: string | null;
  isCheckbackTooFar: boolean;
  isCheckbackOverdue: boolean;
  updates?: TimelineUpdate[];
  processInstances?: any[];
  tasks?: any[];
  [key: string]: any;
}

// Default initial templates list
const defaultTemplates = [
  {
    id: 'tpl-1',
    name: 'Standard Homecare Intake',
    category: 'CLINICAL',
    color: '#3b82f6',
    description: 'Standard NYS Medicaid HHA/PCA intake authorization workflow.',
    stages: [
      { id: 'stg-1', name: 'Referral Intake', dueDays: 1, isFinalStage: false },
      { id: 'stg-2', name: 'Medicaid CIN Verification', dueDays: 2, isFinalStage: false },
      { id: 'stg-3', name: 'Clinical Evaluation & Form 485', dueDays: 3, isFinalStage: false },
      { id: 'stg-4', name: 'Start of Care (SOC) Confirmation', dueDays: 5, isFinalStage: true }
    ]
  },
  {
    id: 'tpl-2',
    name: 'NHTD / TBI Waiver Intake',
    category: 'WAIVER',
    color: '#10b981',
    description: 'Specialized Nursing Home Transition & Diversion intake process.',
    stages: [
      { id: 'stg-10', name: 'Initial Screening', dueDays: 2, isFinalStage: false },
      { id: 'stg-11', name: 'RRDS Referral Submission', dueDays: 7, isFinalStage: false },
      { id: 'stg-12', name: 'Service Plan Development', dueDays: 14, isFinalStage: true }
    ]
  }
];

// Default initial leads list including John Doe (Unqualified Dead End)
const defaultLeads: LeadItem[] = [
  {
    "id": "lead-aug28-01",
    "jotformSubmissionId": "P-PLB25WEGCQ",
    "firstName": "Edward",
    "lastName": "Boykins",
    "name": "Edward Boykins",
    "phone": "(518) 555-1001",
    "email": "edward.boykins@example.com",
    "stage": "QUALIFIED",
    "status": "ON_HOLD",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "A&T Healthcare",
    "serviceType": "NHTD & TBI",
    "county": "GREENE",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Aide / Staffing Matching",
    "blockerNotes": "Reopened Greene 8 hr/wk case; applicant Jessica Vanwagen is not cooperating, stalling progress.",
    "riskLevel": "High",
    "riskScore": 65,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: true,
    "createdAt": "2026-08-21T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-27T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-1",
        "title": "Resolve Aide / Staffing Matching for Edward Boykins",
        "description": "Operational Task: Reopened Greene 8 hr/wk case; applicant Jessica Vanwagen is not cooperating, stalling progress. (SC: A&T Healthcare | Board: Payer Auth Pending & SOC)",
        "dueAt": "2026-08-27T17:00:00.000Z",
        "dueDate": "2026-08-27T17:00:00.000Z",
        "status": "OPEN",
        "priority": "URGENT",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-01",
        "lead": {
          "id": "lead-aug28-01",
          "firstName": "Edward",
          "lastName": "Boykins"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-1-nhtd-tbi",
        "leadId": "lead-aug28-01",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-1-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-1-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-1-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-1-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-1-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-1-1",
            "stageTemplateId": "stg-1-1",
            "stageTemplate": {
              "id": "stg-1-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-1-2",
            "stageTemplateId": "stg-1-2",
            "stageTemplate": {
              "id": "stg-1-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-1-3",
            "stageTemplateId": "stg-1-3",
            "stageTemplate": {
              "id": "stg-1-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-27T17:00:00.000Z"
          },
          {
            "id": "si-1-4",
            "stageTemplateId": "stg-1-4",
            "stageTemplate": {
              "id": "stg-1-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-1-5",
            "stageTemplateId": "stg-1-5",
            "stageTemplate": {
              "id": "stg-1-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-1-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Reopened Greene 8 hr/wk case; applicant Jessica Vanwagen is not cooperating, stalling progress. (Board: Payer Auth Pending & SOC | Stage: Auth Pending (Stalled) | SC Agency: A&T Healthcare | Blocker: Aide / Staffing Matching)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-1-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending SC paperwork & RRDC review.",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-02",
    "jotformSubmissionId": "P-NU0DRXJRXG",
    "firstName": "Pending",
    "lastName": "Name",
    "name": "Pending Name",
    "phone": "(518) 555-1002",
    "email": "pending.name@example.com",
    "stage": "QUALIFIED",
    "status": "ON_HOLD",
    "source": "HCSS Agency Transfer",
    "referralSource": "HCSS Agency Transfer",
    "serviceCoordinator": "Chantal E. (VNHC)",
    "serviceType": "NHTD & TBI",
    "county": "RENSSELAER",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Aide / Staffing Matching",
    "blockerNotes": "Client located in Rensselaer requesting 24/7 care; pending more info on required intake steps to start.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-22T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-2",
        "title": "Resolve Aide / Staffing Matching for Pending Name",
        "description": "Operational Task: Client located in Rensselaer requesting 24/7 care; pending more info on required intake steps to start. (SC: Chantal E. (VNHC) | Board: HCSS Agency Transfer)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-02",
        "lead": {
          "id": "lead-aug28-02",
          "firstName": "Pending",
          "lastName": "Name"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-2-nhtd-tbi",
        "leadId": "lead-aug28-02",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-2-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-2-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-2-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-2-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-2-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-2-1",
            "stageTemplateId": "stg-2-1",
            "stageTemplate": {
              "id": "stg-2-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-2-2",
            "stageTemplateId": "stg-2-2",
            "stageTemplate": {
              "id": "stg-2-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-2-3",
            "stageTemplateId": "stg-2-3",
            "stageTemplate": {
              "id": "stg-2-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-2-4",
            "stageTemplateId": "stg-2-4",
            "stageTemplate": {
              "id": "stg-2-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-2-5",
            "stageTemplateId": "stg-2-5",
            "stageTemplate": {
              "id": "stg-2-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-2-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Client located in Rensselaer requesting 24/7 care; pending more info on required intake steps to start. (Board: HCSS Agency Transfer | Stage: Signed Forms Pending RRDC Approval | SC Agency: Chantal E. (VNHC) | Blocker: Aide / Staffing Matching)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-2-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending SC paperwork & RRDC review.",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-03",
    "jotformSubmissionId": "P-X4Z1RDX9FX",
    "firstName": "Katie",
    "lastName": "Rebecca",
    "name": "Katie Rebecca",
    "phone": "(518) 555-1003",
    "email": "katie.rebecca@example.com",
    "stage": "IN_PROGRESS",
    "status": "IN_PROGRESS",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Rebecca McD.",
    "serviceType": "NHTD & TBI",
    "county": "FRANKLIN",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Aide / Staffing Matching",
    "blockerNotes": "Franklin County case pending ISP. Notes indicate Rebecca has another case in the region, but no concrete next step or document status is recorded; confirm ownership and required intake actions. My Independence / Rebecca McD.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-23T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-3",
        "title": "Resolve Aide / Staffing Matching for Katie Rebecca",
        "description": "Operational Task: Franklin County case pending ISP. Notes indicate Rebecca has another case in the region, but no concrete next step or document status is recorded; confirm ownership and required intake actions. My Independence / Rebecca McD. (SC: Rebecca McD. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-03",
        "lead": {
          "id": "lead-aug28-03",
          "firstName": "Katie",
          "lastName": "Rebecca"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-3-nhtd-tbi",
        "leadId": "lead-aug28-03",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-3-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-3-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-3-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-3-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-3-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-3-1",
            "stageTemplateId": "stg-3-1",
            "stageTemplate": {
              "id": "stg-3-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-3-2",
            "stageTemplateId": "stg-3-2",
            "stageTemplate": {
              "id": "stg-3-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-3-3",
            "stageTemplateId": "stg-3-3",
            "stageTemplate": {
              "id": "stg-3-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-3-4",
            "stageTemplateId": "stg-3-4",
            "stageTemplate": {
              "id": "stg-3-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-3-5",
            "stageTemplateId": "stg-3-5",
            "stageTemplate": {
              "id": "stg-3-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-3-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Franklin County case pending ISP. Notes indicate Rebecca has another case in the region, but no concrete next step or document status is recorded; confirm ownership and required intake actions. My Independence / Rebecca McD. (Board: NHTD/TBI New Enrollment | Stage: Provider Selection Form & Intake Packet | SC Agency: Rebecca McD. | Blocker: Aide / Staffing Matching)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-3-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-04",
    "jotformSubmissionId": "P-RK7BW5H5RY",
    "firstName": "Jennifer",
    "lastName": "Adelson",
    "name": "Jennifer Adelson",
    "phone": "(518) 555-1004",
    "email": "jennifer.adelson@example.com",
    "stage": "CONTACTED",
    "status": "CONTACTED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Rebecca M.",
    "serviceType": "NHTD & TBI",
    "county": "GREENE",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Housing / Nursing Home Transition",
    "blockerNotes": "New NHTD case in Greene. Client remains in a nursing home and cannot progress until housing is secured; expect a longer timeline. My Independence / Rebecca M.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-24T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-4",
        "title": "Resolve Housing / Nursing Home Transition for Jennifer Adelson",
        "description": "Operational Task: New NHTD case in Greene. Client remains in a nursing home and cannot progress until housing is secured; expect a longer timeline. My Independence / Rebecca M. (SC: Rebecca M. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-04",
        "lead": {
          "id": "lead-aug28-04",
          "firstName": "Jennifer",
          "lastName": "Adelson"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-4-nhtd-tbi",
        "leadId": "lead-aug28-04",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-4-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-4-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-4-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-4-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-4-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-4-1",
            "stageTemplateId": "stg-4-1",
            "stageTemplate": {
              "id": "stg-4-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-4-2",
            "stageTemplateId": "stg-4-2",
            "stageTemplate": {
              "id": "stg-4-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-4-3",
            "stageTemplateId": "stg-4-3",
            "stageTemplate": {
              "id": "stg-4-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-4-4",
            "stageTemplateId": "stg-4-4",
            "stageTemplate": {
              "id": "stg-4-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-4-5",
            "stageTemplateId": "stg-4-5",
            "stageTemplate": {
              "id": "stg-4-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-4-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: New NHTD case in Greene. Client remains in a nursing home and cannot progress until housing is secured; expect a longer timeline. My Independence / Rebecca M. (Board: NHTD/TBI New Enrollment | Stage: New NHTD | SC Agency: Rebecca M. | Blocker: Housing / Nursing Home Transition)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-4-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: TBD",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-05",
    "jotformSubmissionId": "P-FX6BFQNY8J",
    "firstName": "John",
    "lastName": "Gallo",
    "name": "John Gallo",
    "phone": "(518) 555-1005",
    "email": "john.gallo@example.com",
    "stage": "UNQUALIFIED",
    "status": "UNQUALIFIED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Shelley Skellington (Marketer)",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Initial Referral Intake Step",
    "blockerNotes": "CASE CANCELLED & CLOSED due to history of violent behavior (aggressive & sexual assault).",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-25T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-5",
        "title": "Resolve Initial Referral Intake Step for John Gallo",
        "description": "Operational Task: CASE CANCELLED & CLOSED due to history of violent behavior (aggressive & sexual assault). (SC: Shelley Skellington (Marketer) | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-05",
        "lead": {
          "id": "lead-aug28-05",
          "firstName": "John",
          "lastName": "Gallo"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-5-nhtd-tbi",
        "leadId": "lead-aug28-05",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-5-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-5-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-5-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-5-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-5-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "CLOSED",
        "stageInstances": [
          {
            "id": "si-5-1",
            "stageTemplateId": "stg-5-1",
            "stageTemplate": {
              "id": "stg-5-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-5-2",
            "stageTemplateId": "stg-5-2",
            "stageTemplate": {
              "id": "stg-5-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-5-3",
            "stageTemplateId": "stg-5-3",
            "stageTemplate": {
              "id": "stg-5-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-5-4",
            "stageTemplateId": "stg-5-4",
            "stageTemplate": {
              "id": "stg-5-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-5-5",
            "stageTemplateId": "stg-5-5",
            "stageTemplate": {
              "id": "stg-5-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-5-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: CASE CANCELLED & CLOSED due to history of violent behavior (aggressive & sexual assault). (Board: NHTD/TBI New Enrollment | Stage: Cancelled & Closed | SC Agency: Shelley Skellington (Marketer) | Blocker: Initial Referral Intake Step)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-5-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: History of violent behavior- aggresive and sexual assault",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-06",
    "jotformSubmissionId": "P-DKZQ0M0Y7V",
    "firstName": "Pending",
    "lastName": "Name",
    "name": "Pending Name",
    "phone": "(518) 555-1006",
    "email": "pending.name@example.com",
    "stage": "QUALIFIED",
    "status": "ON_HOLD",
    "source": "HCSS Agency Transfer",
    "referralSource": "HCSS Agency Transfer",
    "serviceCoordinator": "Erin S. (VNHC)",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Provider Selection / Signature Missing",
    "blockerNotes": "Pending provider selection form signature; SC visit scheduled in a month to finalize hour split with Fort Hudson.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-26T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-6",
        "title": "Resolve Provider Selection / Signature Missing for Pending Name",
        "description": "Operational Task: Pending provider selection form signature; SC visit scheduled in a month to finalize hour split with Fort Hudson. (SC: Erin S. (VNHC) | Board: HCSS Agency Transfer)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-06",
        "lead": {
          "id": "lead-aug28-06",
          "firstName": "Pending",
          "lastName": "Name"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-6-nhtd-tbi",
        "leadId": "lead-aug28-06",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-6-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-6-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-6-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-6-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-6-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-6-1",
            "stageTemplateId": "stg-6-1",
            "stageTemplate": {
              "id": "stg-6-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-6-2",
            "stageTemplateId": "stg-6-2",
            "stageTemplate": {
              "id": "stg-6-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-6-3",
            "stageTemplateId": "stg-6-3",
            "stageTemplate": {
              "id": "stg-6-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-6-4",
            "stageTemplateId": "stg-6-4",
            "stageTemplate": {
              "id": "stg-6-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-6-5",
            "stageTemplateId": "stg-6-5",
            "stageTemplate": {
              "id": "stg-6-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-6-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Pending provider selection form signature; SC visit scheduled in a month to finalize hour split with Fort Hudson. (Board: HCSS Agency Transfer | Stage: Signed Forms Pending RRDC Approval | SC Agency: Erin S. (VNHC) | Blocker: Provider Selection / Signature Missing)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-6-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: AT72969A- Doreen?",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-07",
    "jotformSubmissionId": "P-7L0JFB6F4D",
    "firstName": "Female",
    "lastName": "Client (schenectady hcss)",
    "name": "Female Client (schenectady hcss)",
    "phone": "(518) 555-1007",
    "email": "female.client(schenectadyhcss)@example.com",
    "stage": "QUALIFIED",
    "status": "ON_HOLD",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Holly C. (Unlimited Care, Inc.)",
    "serviceType": "NHTD & TBI",
    "county": "SCHENECTADY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Provider Selection / Signature Missing",
    "blockerNotes": "20h/day HCSS transfer case in Schenectady (2965 W Old State Rd). 1-person transfer pivot, wheelchair user. Needs follow up with Holly for CIN & form.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-27T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-7",
        "title": "Resolve Provider Selection / Signature Missing for Female Client (schenectady hcss)",
        "description": "Operational Task: 20h/day HCSS transfer case in Schenectady (2965 W Old State Rd). 1-person transfer pivot, wheelchair user. Needs follow up with Holly for CIN & form. (SC: Holly C. (Unlimited Care, Inc.) | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-07",
        "lead": {
          "id": "lead-aug28-07",
          "firstName": "Female",
          "lastName": "Client (schenectady hcss)"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-7-nhtd-tbi",
        "leadId": "lead-aug28-07",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-7-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-7-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-7-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-7-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-7-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-7-1",
            "stageTemplateId": "stg-7-1",
            "stageTemplate": {
              "id": "stg-7-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-7-2",
            "stageTemplateId": "stg-7-2",
            "stageTemplate": {
              "id": "stg-7-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-7-3",
            "stageTemplateId": "stg-7-3",
            "stageTemplate": {
              "id": "stg-7-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-7-4",
            "stageTemplateId": "stg-7-4",
            "stageTemplate": {
              "id": "stg-7-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-7-5",
            "stageTemplateId": "stg-7-5",
            "stageTemplate": {
              "id": "stg-7-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-7-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: 20h/day HCSS transfer case in Schenectady (2965 W Old State Rd). 1-person transfer pivot, wheelchair user. Needs follow up with Holly for CIN & form. (Board: NHTD/TBI New Enrollment | Stage: NOD Pending NHTD | SC Agency: Holly C. (Unlimited Care, Inc.) | Blocker: Provider Selection / Signature Missing)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-7-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending SC paperwork & RRDC review.",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-08",
    "jotformSubmissionId": "P-HK3J75YR3Q",
    "firstName": "Carolyn",
    "lastName": "Jones",
    "name": "Carolyn Jones",
    "phone": "(518) 555-1008",
    "email": "carolyn.jones@example.com",
    "stage": "UNQUALIFIED",
    "status": "UNQUALIFIED",
    "source": "HCSS Agency Transfer",
    "referralSource": "HCSS Agency Transfer",
    "serviceCoordinator": "Holly M. (Upstate Advocacy)",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Provider Selection / Signature Missing",
    "blockerNotes": "Pending client call to confirm required steps for agency switch request.",
    "riskLevel": "High",
    "riskScore": 65,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: true,
    "createdAt": "2026-08-20T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-27T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-8",
        "title": "Resolve Provider Selection / Signature Missing for Carolyn Jones",
        "description": "Operational Task: Pending client call to confirm required steps for agency switch request. (SC: Holly M. (Upstate Advocacy) | Board: HCSS Agency Transfer)",
        "dueAt": "2026-08-27T17:00:00.000Z",
        "dueDate": "2026-08-27T17:00:00.000Z",
        "status": "OPEN",
        "priority": "URGENT",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-08",
        "lead": {
          "id": "lead-aug28-08",
          "firstName": "Carolyn",
          "lastName": "Jones"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-8-nhtd-tbi",
        "leadId": "lead-aug28-08",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-8-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-8-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-8-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-8-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-8-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "CLOSED",
        "stageInstances": [
          {
            "id": "si-8-1",
            "stageTemplateId": "stg-8-1",
            "stageTemplate": {
              "id": "stg-8-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-8-2",
            "stageTemplateId": "stg-8-2",
            "stageTemplate": {
              "id": "stg-8-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-27T17:00:00.000Z"
          },
          {
            "id": "si-8-3",
            "stageTemplateId": "stg-8-3",
            "stageTemplate": {
              "id": "stg-8-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-8-4",
            "stageTemplateId": "stg-8-4",
            "stageTemplate": {
              "id": "stg-8-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-8-5",
            "stageTemplateId": "stg-8-5",
            "stageTemplate": {
              "id": "stg-8-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-8-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Pending client call to confirm required steps for agency switch request. (Board: HCSS Agency Transfer | Stage: Stuck HCSS | SC Agency: Holly M. (Upstate Advocacy) | Blocker: Provider Selection / Signature Missing)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-8-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Zev",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-09",
    "jotformSubmissionId": "P-GDTVZTXCK5",
    "firstName": "Luis",
    "lastName": "Gonzalez",
    "name": "Luis Gonzalez",
    "phone": "(518) 555-1009",
    "email": "luis.gonzalez@example.com",
    "stage": "IN_PROGRESS",
    "status": "IN_PROGRESS",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Spanish SC Selected: Lillian",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Provider Selection / Signature Missing",
    "blockerNotes": "Aug 17 (Jeffrey Mendoza): Client confirmed PCP docs filled and mailed 2 wks ago. Zev & Lillian confirmed Spanish SC assignment. Lillian taking case after closing Samuel.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-21T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-9",
        "title": "Resolve Provider Selection / Signature Missing for Luis Gonzalez",
        "description": "Operational Task: Aug 17 (Jeffrey Mendoza): Client confirmed PCP docs filled and mailed 2 wks ago. Zev & Lillian confirmed Spanish SC assignment. Lillian taking case after closing Samuel. (SC: Spanish SC Selected: Lillian | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-09",
        "lead": {
          "id": "lead-aug28-09",
          "firstName": "Luis",
          "lastName": "Gonzalez"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-9-nhtd-tbi",
        "leadId": "lead-aug28-09",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-9-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-9-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-9-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-9-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-9-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-9-1",
            "stageTemplateId": "stg-9-1",
            "stageTemplate": {
              "id": "stg-9-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-9-2",
            "stageTemplateId": "stg-9-2",
            "stageTemplate": {
              "id": "stg-9-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-9-3",
            "stageTemplateId": "stg-9-3",
            "stageTemplate": {
              "id": "stg-9-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-9-4",
            "stageTemplateId": "stg-9-4",
            "stageTemplate": {
              "id": "stg-9-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-9-5",
            "stageTemplateId": "stg-9-5",
            "stageTemplate": {
              "id": "stg-9-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-9-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Aug 17 (Jeffrey Mendoza): Client confirmed PCP docs filled and mailed 2 wks ago. Zev & Lillian confirmed Spanish SC assignment. Lillian taking case after closing Samuel. (Board: NHTD/TBI New Enrollment | Stage: Intake / SC Assigned | SC Agency: Spanish SC Selected: Lillian | Blocker: Provider Selection / Signature Missing)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-9-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-10",
    "jotformSubmissionId": "P-CN2XFZV3AM",
    "firstName": "Deborah",
    "lastName": "L.",
    "name": "Deborah L.",
    "phone": "(518) 555-1010",
    "email": "deborah.l.@example.com",
    "stage": "IN_PROGRESS",
    "status": "IN_PROGRESS",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Unspecified",
    "serviceType": "NHTD & TBI",
    "county": "RENSSELAER",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Provider Selection / Signature Missing",
    "blockerNotes": "New NHTD lead in Rensselaer. Intake is at the earliest stage with all documentation and coordination still pending; family communication is noted as difficult. No coordinator assigned.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-22T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-10",
        "title": "Resolve Provider Selection / Signature Missing for Deborah L.",
        "description": "Operational Task: New NHTD lead in Rensselaer. Intake is at the earliest stage with all documentation and coordination still pending; family communication is noted as difficult. No coordinator assigned. (SC: Unspecified | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-10",
        "lead": {
          "id": "lead-aug28-10",
          "firstName": "Deborah",
          "lastName": "L."
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-10-nhtd-tbi",
        "leadId": "lead-aug28-10",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-10-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-10-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-10-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-10-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-10-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-10-1",
            "stageTemplateId": "stg-10-1",
            "stageTemplate": {
              "id": "stg-10-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-10-2",
            "stageTemplateId": "stg-10-2",
            "stageTemplate": {
              "id": "stg-10-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-10-3",
            "stageTemplateId": "stg-10-3",
            "stageTemplate": {
              "id": "stg-10-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-10-4",
            "stageTemplateId": "stg-10-4",
            "stageTemplate": {
              "id": "stg-10-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-10-5",
            "stageTemplateId": "stg-10-5",
            "stageTemplate": {
              "id": "stg-10-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-10-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: New NHTD lead in Rensselaer. Intake is at the earliest stage with all documentation and coordination still pending; family communication is noted as difficult. No coordinator assigned. (Board: NHTD/TBI New Enrollment | Stage: Pending ISP | SC Agency: Unspecified | Blocker: Provider Selection / Signature Missing)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-10-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: TBD",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-11",
    "jotformSubmissionId": "P-L618GHN73L",
    "firstName": "Sheila",
    "lastName": "Morehouse",
    "name": "Sheila Morehouse",
    "phone": "(518) 555-1011",
    "email": "sheila.morehouse@example.com",
    "stage": "QUALIFIED",
    "status": "ON_HOLD",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Dianne C.",
    "serviceType": "NHTD & TBI",
    "county": "WARREN",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "RRDC Approval Pending",
    "blockerNotes": "NOD pending NHTD case in Warren for roughly 12\u201324 hrs/week. Home abstract and UAS are outstanding; recent fall/PT involvement is noted. Fort Hudson / Dianne C.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-23T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-11",
        "title": "Resolve RRDC Approval Pending for Sheila Morehouse",
        "description": "Operational Task: NOD pending NHTD case in Warren for roughly 12\u201324 hrs/week. Home abstract and UAS are outstanding; recent fall/PT involvement is noted. Fort Hudson / Dianne C. (SC: Dianne C. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-11",
        "lead": {
          "id": "lead-aug28-11",
          "firstName": "Sheila",
          "lastName": "Morehouse"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-11-nhtd-tbi",
        "leadId": "lead-aug28-11",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-11-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-11-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-11-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-11-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-11-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-11-1",
            "stageTemplateId": "stg-11-1",
            "stageTemplate": {
              "id": "stg-11-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-11-2",
            "stageTemplateId": "stg-11-2",
            "stageTemplate": {
              "id": "stg-11-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-11-3",
            "stageTemplateId": "stg-11-3",
            "stageTemplate": {
              "id": "stg-11-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-11-4",
            "stageTemplateId": "stg-11-4",
            "stageTemplate": {
              "id": "stg-11-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-11-5",
            "stageTemplateId": "stg-11-5",
            "stageTemplate": {
              "id": "stg-11-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-11-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: NOD pending NHTD case in Warren for roughly 12\u201324 hrs/week. Home abstract and UAS are outstanding; recent fall/PT involvement is noted. Fort Hudson / Dianne C. (Board: NHTD/TBI New Enrollment | Stage: NOD Pending NHTD | SC Agency: Dianne C. | Blocker: RRDC Approval Pending)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-11-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending SC paperwork & RRDC review.",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-12",
    "jotformSubmissionId": "P-J07VCEXRQP",
    "firstName": "David",
    "lastName": "Weeks",
    "name": "David Weeks",
    "phone": "(518) 555-1012",
    "email": "david.weeks@example.com",
    "stage": "QUALIFIED",
    "status": "ON_HOLD",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Holly M.",
    "serviceType": "NHTD & TBI",
    "county": "SCHENECTADY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "RRDC Approval Pending",
    "blockerNotes": "NOD pending in Schenectady for 16 hrs/week. NOD corrections, home abstract, and UAS remain outstanding. Upstate Advocacy / Holly M.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-24T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-12",
        "title": "Resolve RRDC Approval Pending for David Weeks",
        "description": "Operational Task: NOD pending in Schenectady for 16 hrs/week. NOD corrections, home abstract, and UAS remain outstanding. Upstate Advocacy / Holly M. (SC: Holly M. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-12",
        "lead": {
          "id": "lead-aug28-12",
          "firstName": "David",
          "lastName": "Weeks"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-12-nhtd-tbi",
        "leadId": "lead-aug28-12",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-12-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-12-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-12-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-12-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-12-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-12-1",
            "stageTemplateId": "stg-12-1",
            "stageTemplate": {
              "id": "stg-12-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-12-2",
            "stageTemplateId": "stg-12-2",
            "stageTemplate": {
              "id": "stg-12-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-12-3",
            "stageTemplateId": "stg-12-3",
            "stageTemplate": {
              "id": "stg-12-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-12-4",
            "stageTemplateId": "stg-12-4",
            "stageTemplate": {
              "id": "stg-12-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-12-5",
            "stageTemplateId": "stg-12-5",
            "stageTemplate": {
              "id": "stg-12-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-12-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: NOD pending in Schenectady for 16 hrs/week. NOD corrections, home abstract, and UAS remain outstanding. Upstate Advocacy / Holly M. (Board: NHTD/TBI New Enrollment | Stage: NOD Pending NHTD | SC Agency: Holly M. | Blocker: RRDC Approval Pending)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-12-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Fixed corrections",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-13",
    "jotformSubmissionId": "P-0ABFEIOYTT",
    "firstName": "Shirley",
    "lastName": "Swears",
    "name": "Shirley Swears",
    "phone": "(518) 555-1013",
    "email": "shirley.swears@example.com",
    "stage": "QUALIFIED",
    "status": "ON_HOLD",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Joann W.",
    "serviceType": "NHTD & TBI",
    "county": "SARATOGA",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "RRDC Approval Pending",
    "blockerNotes": "NOD pending NHTD case in Saratoga. CIN and medical notes are needed before requesting the home abstract/UAS; an addendum is also required. Fort Hudson / Joann W.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-25T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-13",
        "title": "Resolve RRDC Approval Pending for Shirley Swears",
        "description": "Operational Task: NOD pending NHTD case in Saratoga. CIN and medical notes are needed before requesting the home abstract/UAS; an addendum is also required. Fort Hudson / Joann W. (SC: Joann W. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-13",
        "lead": {
          "id": "lead-aug28-13",
          "firstName": "Shirley",
          "lastName": "Swears"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-13-nhtd-tbi",
        "leadId": "lead-aug28-13",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-13-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-13-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-13-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-13-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-13-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-13-1",
            "stageTemplateId": "stg-13-1",
            "stageTemplate": {
              "id": "stg-13-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-13-2",
            "stageTemplateId": "stg-13-2",
            "stageTemplate": {
              "id": "stg-13-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-13-3",
            "stageTemplateId": "stg-13-3",
            "stageTemplate": {
              "id": "stg-13-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-13-4",
            "stageTemplateId": "stg-13-4",
            "stageTemplate": {
              "id": "stg-13-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-13-5",
            "stageTemplateId": "stg-13-5",
            "stageTemplate": {
              "id": "stg-13-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-13-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: NOD pending NHTD case in Saratoga. CIN and medical notes are needed before requesting the home abstract/UAS; an addendum is also required. Fort Hudson / Joann W. (Board: NHTD/TBI New Enrollment | Stage: NOD Pending NHTD | SC Agency: Joann W. | Blocker: RRDC Approval Pending)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-13-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending SC paperwork & RRDC review.",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-14",
    "jotformSubmissionId": "P-R6EUKY23K2",
    "firstName": "Esther",
    "lastName": "Washburn",
    "name": "Esther Washburn",
    "phone": "(518) 555-1014",
    "email": "esther.washburn@example.com",
    "stage": "QUALIFIED",
    "status": "ACTIVE_PATIENT",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Kigi Services",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "RRDC Approval Pending",
    "blockerNotes": "Received Notice of Decision (NOD) for Start of Care (SOC) effective 8/20/2026. 49 hrs/wk; active caregiver Lisa Marpe ready.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-26T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-14",
        "title": "Resolve RRDC Approval Pending for Esther Washburn",
        "description": "Operational Task: Received Notice of Decision (NOD) for Start of Care (SOC) effective 8/20/2026. 49 hrs/wk; active caregiver Lisa Marpe ready. (SC: Kigi Services | Board: Payer Auth Pending & SOC)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-14",
        "lead": {
          "id": "lead-aug28-14",
          "firstName": "Esther",
          "lastName": "Washburn"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-14-nhtd-tbi",
        "leadId": "lead-aug28-14",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-14-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-14-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-14-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-14-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-14-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-14-1",
            "stageTemplateId": "stg-14-1",
            "stageTemplate": {
              "id": "stg-14-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-14-2",
            "stageTemplateId": "stg-14-2",
            "stageTemplate": {
              "id": "stg-14-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-14-3",
            "stageTemplateId": "stg-14-3",
            "stageTemplate": {
              "id": "stg-14-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-22T09:00:00.000Z",
            "completedAt": "2026-08-23T17:00:00.000Z",
            "dueAt": "2026-08-23T17:00:00.000Z"
          },
          {
            "id": "si-14-4",
            "stageTemplateId": "stg-14-4",
            "stageTemplate": {
              "id": "stg-14-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-14-5",
            "stageTemplateId": "stg-14-5",
            "stageTemplate": {
              "id": "stg-14-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-14-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Received Notice of Decision (NOD) for Start of Care (SOC) effective 8/20/2026. 49 hrs/wk; active caregiver Lisa Marpe ready. (Board: Payer Auth Pending & SOC | Stage: Start of Care (SOC) | SC Agency: Kigi Services | Blocker: RRDC Approval Pending)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-14-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: NOD Received for SOC 8/20/2026",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-15",
    "jotformSubmissionId": "P-15LA0DVR4D",
    "firstName": "Annie",
    "lastName": "Wilson",
    "name": "Annie Wilson",
    "phone": "(518) 555-1015",
    "email": "annie.wilson@example.com",
    "stage": "QUALIFIED",
    "status": "ON_HOLD",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Prompt",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "RRDC Approval Pending",
    "blockerNotes": "Pending new NOD post county transfer with 7x12 schedule (84 hrs/wk). Target SOC was Aug 17.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-27T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-15",
        "title": "Resolve RRDC Approval Pending for Annie Wilson",
        "description": "Operational Task: Pending new NOD post county transfer with 7x12 schedule (84 hrs/wk). Target SOC was Aug 17. (SC: Prompt | Board: Payer Auth Pending & SOC)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-15",
        "lead": {
          "id": "lead-aug28-15",
          "firstName": "Annie",
          "lastName": "Wilson"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-15-nhtd-tbi",
        "leadId": "lead-aug28-15",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-15-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-15-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-15-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-15-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-15-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-15-1",
            "stageTemplateId": "stg-15-1",
            "stageTemplate": {
              "id": "stg-15-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-15-2",
            "stageTemplateId": "stg-15-2",
            "stageTemplate": {
              "id": "stg-15-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-15-3",
            "stageTemplateId": "stg-15-3",
            "stageTemplate": {
              "id": "stg-15-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-15-4",
            "stageTemplateId": "stg-15-4",
            "stageTemplate": {
              "id": "stg-15-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-15-5",
            "stageTemplateId": "stg-15-5",
            "stageTemplate": {
              "id": "stg-15-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-15-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Pending new NOD post county transfer with 7x12 schedule (84 hrs/wk). Target SOC was Aug 17. (Board: Payer Auth Pending & SOC | Stage: Auth Pending / Post-Transfer | SC Agency: Prompt | Blocker: RRDC Approval Pending)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-15-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: 84 hrs/wk (7x12 Schedule) Post-Transfer",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-16",
    "jotformSubmissionId": "1747778433030936",
    "firstName": "Cynthia",
    "lastName": "Kelsay",
    "name": "Cynthia Kelsay",
    "phone": "(518) 555-1016",
    "email": "cynthia.kelsay@example.com",
    "stage": "NEW",
    "status": "NEW",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Unspecified",
    "serviceType": "NHTD & TBI",
    "county": "WARREN",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Service Coordination Paperwork In Progress/Missing",
    "blockerNotes": "Warren shared-hours case awaiting RRDC approval; provider selection form pending with SC for female weekend coverage.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 0,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-20T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-16",
        "title": "Resolve Service Coordination Paperwork In Progress/Missing for Cynthia Kelsay",
        "description": "Operational Task: Warren shared-hours case awaiting RRDC approval; provider selection form pending with SC for female weekend coverage. (SC: Unspecified | Board: Unqualified Audit)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-16",
        "lead": {
          "id": "lead-aug28-16",
          "firstName": "Cynthia",
          "lastName": "Kelsay"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-16-nhtd-tbi",
        "leadId": "lead-aug28-16",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-16-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-16-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-16-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-16-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-16-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-16-1",
            "stageTemplateId": "stg-16-1",
            "stageTemplate": {
              "id": "stg-16-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-16-2",
            "stageTemplateId": "stg-16-2",
            "stageTemplate": {
              "id": "stg-16-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-16-3",
            "stageTemplateId": "stg-16-3",
            "stageTemplate": {
              "id": "stg-16-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-16-4",
            "stageTemplateId": "stg-16-4",
            "stageTemplate": {
              "id": "stg-16-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-16-5",
            "stageTemplateId": "stg-16-5",
            "stageTemplate": {
              "id": "stg-16-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-16-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Warren shared-hours case awaiting RRDC approval; provider selection form pending with SC for female weekend coverage. (Board: Unqualified Audit | Stage: High Priority Shared Hours | SC Agency: Unspecified | Blocker: Service Coordination Paperwork In Progress/Missing)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-16-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending SC paperwork & RRDC review.",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-17",
    "jotformSubmissionId": "P-LCDIM4GEY1",
    "firstName": "Filomena",
    "lastName": "Egan",
    "name": "Filomena Egan",
    "phone": "(518) 555-1017",
    "email": "filomena.egan@example.com",
    "stage": "IN_PROGRESS",
    "status": "IN_PROGRESS",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Anna Y.",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "UAS & Home Abstract Outstanding",
    "blockerNotes": "New Albany NHTD case pending ISP. UAS is complete; home abstract remains outstanding. Kigi Services / Anna Y.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-21T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-17",
        "title": "Resolve UAS & Home Abstract Outstanding for Filomena Egan",
        "description": "Operational Task: New Albany NHTD case pending ISP. UAS is complete; home abstract remains outstanding. Kigi Services / Anna Y. (SC: Anna Y. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-17",
        "lead": {
          "id": "lead-aug28-17",
          "firstName": "Filomena",
          "lastName": "Egan"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-17-nhtd-tbi",
        "leadId": "lead-aug28-17",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-17-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-17-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-17-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-17-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-17-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-17-1",
            "stageTemplateId": "stg-17-1",
            "stageTemplate": {
              "id": "stg-17-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-17-2",
            "stageTemplateId": "stg-17-2",
            "stageTemplate": {
              "id": "stg-17-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-17-3",
            "stageTemplateId": "stg-17-3",
            "stageTemplate": {
              "id": "stg-17-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-17-4",
            "stageTemplateId": "stg-17-4",
            "stageTemplate": {
              "id": "stg-17-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-17-5",
            "stageTemplateId": "stg-17-5",
            "stageTemplate": {
              "id": "stg-17-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-17-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: New Albany NHTD case pending ISP. UAS is complete; home abstract remains outstanding. Kigi Services / Anna Y. (Board: NHTD/TBI New Enrollment | Stage: Pending ISP | SC Agency: Anna Y. | Blocker: UAS & Home Abstract Outstanding)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-17-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Paperwork due 8/24",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-18",
    "jotformSubmissionId": "P-VMXUOALF5T",
    "firstName": "Judy",
    "lastName": "Bradt",
    "name": "Judy Bradt",
    "phone": "(518) 555-1018",
    "email": "judy.bradt@example.com",
    "stage": "IN_PROGRESS",
    "status": "IN_PROGRESS",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Erin S.",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "UAS & Home Abstract Outstanding",
    "blockerNotes": "Pending ISP in Albany for 10\u201315 hrs/week. UAS, home abstract, and provider selection form are outstanding; follow up with Kim. VNHC / Erin S.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-22T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-18",
        "title": "Resolve UAS & Home Abstract Outstanding for Judy Bradt",
        "description": "Operational Task: Pending ISP in Albany for 10\u201315 hrs/week. UAS, home abstract, and provider selection form are outstanding; follow up with Kim. VNHC / Erin S. (SC: Erin S. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-18",
        "lead": {
          "id": "lead-aug28-18",
          "firstName": "Judy",
          "lastName": "Bradt"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-18-nhtd-tbi",
        "leadId": "lead-aug28-18",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-18-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-18-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-18-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-18-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-18-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-18-1",
            "stageTemplateId": "stg-18-1",
            "stageTemplate": {
              "id": "stg-18-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-18-2",
            "stageTemplateId": "stg-18-2",
            "stageTemplate": {
              "id": "stg-18-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-18-3",
            "stageTemplateId": "stg-18-3",
            "stageTemplate": {
              "id": "stg-18-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-18-4",
            "stageTemplateId": "stg-18-4",
            "stageTemplate": {
              "id": "stg-18-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-18-5",
            "stageTemplateId": "stg-18-5",
            "stageTemplate": {
              "id": "stg-18-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-18-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Pending ISP in Albany for 10\u201315 hrs/week. UAS, home abstract, and provider selection form are outstanding; follow up with Kim. VNHC / Erin S. (Board: NHTD/TBI New Enrollment | Stage: Pending ISP | SC Agency: Erin S. | Blocker: UAS & Home Abstract Outstanding)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-18-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: SCheduled for 8/20",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-19",
    "jotformSubmissionId": "P-XVFKJE1ZTF",
    "firstName": "Glenn",
    "lastName": "Tryon",
    "name": "Glenn Tryon",
    "phone": "(518) 555-1019",
    "email": "glenn.tryon@example.com",
    "stage": "IN_PROGRESS",
    "status": "IN_PROGRESS",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Jeff R.",
    "serviceType": "NHTD & TBI",
    "county": "SCHENECTADY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "UAS & Home Abstract Outstanding",
    "blockerNotes": "Schenectady TBI case. Abstract & UAS scheduling through Epilepsy Center for week of Aug 24.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-23T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-19",
        "title": "Resolve UAS & Home Abstract Outstanding for Glenn Tryon",
        "description": "Operational Task: Schenectady TBI case. Abstract & UAS scheduling through Epilepsy Center for week of Aug 24. (SC: Jeff R. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-19",
        "lead": {
          "id": "lead-aug28-19",
          "firstName": "Glenn",
          "lastName": "Tryon"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-19-nhtd-tbi",
        "leadId": "lead-aug28-19",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-19-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-19-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-19-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-19-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-19-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-19-1",
            "stageTemplateId": "stg-19-1",
            "stageTemplate": {
              "id": "stg-19-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-19-2",
            "stageTemplateId": "stg-19-2",
            "stageTemplate": {
              "id": "stg-19-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-19-3",
            "stageTemplateId": "stg-19-3",
            "stageTemplate": {
              "id": "stg-19-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-19-4",
            "stageTemplateId": "stg-19-4",
            "stageTemplate": {
              "id": "stg-19-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-19-5",
            "stageTemplateId": "stg-19-5",
            "stageTemplate": {
              "id": "stg-19-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-19-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Schenectady TBI case. Abstract & UAS scheduling through Epilepsy Center for week of Aug 24. (Board: NHTD/TBI New Enrollment | Stage: High Priority Assessment | SC Agency: Jeff R. | Blocker: UAS & Home Abstract Outstanding)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-19-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Abstract/UAS Scheduled Week of 8/24",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-20",
    "jotformSubmissionId": "P-ZQIBNYLMTQ",
    "firstName": "Kimberly",
    "lastName": "Hogan",
    "name": "Kimberly Hogan",
    "phone": "(518) 555-1020",
    "email": "kimberly.hogan@example.com",
    "stage": "NEW",
    "status": "NEW",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Kevin O.",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "UAS & Home Abstract Outstanding",
    "blockerNotes": "URGENT RRDC NOTICE: RRDC has a discontinuance happening unless Revised Service Plan (RSP) is submitted by 8/31/2026. CDPAP conversion in Albany; HCSS caregiver cannot be Steven Elting.",
    "riskLevel": "Critical",
    "riskScore": 85,
    "totalCallAttempts": 0,
    isCheckbackTooFar: false,
    isCheckbackOverdue: true,
    "createdAt": "2026-08-24T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-27T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-20",
        "title": "Resolve UAS & Home Abstract Outstanding for Kimberly Hogan",
        "description": "Operational Task: URGENT RRDC NOTICE: RRDC has a discontinuance happening unless Revised Service Plan (RSP) is submitted by 8/31/2026. CDPAP conversion in Albany; HCSS caregiver cannot be Steven Elting. (SC: Kevin O. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-27T17:00:00.000Z",
        "dueDate": "2026-08-27T17:00:00.000Z",
        "status": "OPEN",
        "priority": "URGENT",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-20",
        "lead": {
          "id": "lead-aug28-20",
          "firstName": "Kimberly",
          "lastName": "Hogan"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-20-nhtd-tbi",
        "leadId": "lead-aug28-20",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-20-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-20-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-20-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-20-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-20-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-20-1",
            "stageTemplateId": "stg-20-1",
            "stageTemplate": {
              "id": "stg-20-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-27T17:00:00.000Z"
          },
          {
            "id": "si-20-2",
            "stageTemplateId": "stg-20-2",
            "stageTemplate": {
              "id": "stg-20-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-20-3",
            "stageTemplateId": "stg-20-3",
            "stageTemplate": {
              "id": "stg-20-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-20-4",
            "stageTemplateId": "stg-20-4",
            "stageTemplate": {
              "id": "stg-20-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-20-5",
            "stageTemplateId": "stg-20-5",
            "stageTemplate": {
              "id": "stg-20-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-20-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: URGENT RRDC NOTICE: RRDC has a discontinuance happening unless Revised Service Plan (RSP) is submitted by 8/31/2026. CDPAP conversion in Albany; HCSS caregiver cannot be Steven Elting. (Board: NHTD/TBI New Enrollment | Stage: Urgent RRDC Review | SC Agency: Kevin O. | Blocker: UAS & Home Abstract Outstanding)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-20-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: RRDC Discontinuance Deadline: RSP due 8/31",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-21",
    "jotformSubmissionId": "P-24BMJOWSB8",
    "firstName": "Martin",
    "lastName": "Finn",
    "name": "Martin Finn",
    "phone": "(518) 555-1021",
    "email": "martin.finn@example.com",
    "stage": "IN_PROGRESS",
    "status": "IN_PROGRESS",
    "source": "HCSS Agency Transfer",
    "referralSource": "HCSS Agency Transfer",
    "serviceCoordinator": "Living resources",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "UAS & Home Abstract Outstanding",
    "blockerNotes": "Vendor change in Albany (6 hrs/wk). Home Abstract visit scheduled for Aug 21.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-25T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-21",
        "title": "Resolve UAS & Home Abstract Outstanding for Martin Finn",
        "description": "Operational Task: Vendor change in Albany (6 hrs/wk). Home Abstract visit scheduled for Aug 21. (SC: Living resources | Board: HCSS Agency Transfer)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-21",
        "lead": {
          "id": "lead-aug28-21",
          "firstName": "Martin",
          "lastName": "Finn"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-21-nhtd-tbi",
        "leadId": "lead-aug28-21",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-21-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-21-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-21-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-21-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-21-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-21-1",
            "stageTemplateId": "stg-21-1",
            "stageTemplate": {
              "id": "stg-21-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-21-2",
            "stageTemplateId": "stg-21-2",
            "stageTemplate": {
              "id": "stg-21-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-21-3",
            "stageTemplateId": "stg-21-3",
            "stageTemplate": {
              "id": "stg-21-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-21-4",
            "stageTemplateId": "stg-21-4",
            "stageTemplate": {
              "id": "stg-21-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-21-5",
            "stageTemplateId": "stg-21-5",
            "stageTemplate": {
              "id": "stg-21-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-21-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Vendor change in Albany (6 hrs/wk). Home Abstract visit scheduled for Aug 21. (Board: HCSS Agency Transfer | Stage: Home Abstract if needed | SC Agency: Living resources | Blocker: UAS & Home Abstract Outstanding)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-21-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Home Abstract Visit 8/21",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-22",
    "jotformSubmissionId": "P-F77TO0KH67",
    "firstName": "Pending",
    "lastName": "Pending",
    "name": "Pending Pending",
    "phone": "(518) 555-1022",
    "email": "pending.pending@example.com",
    "stage": "CONTACTED",
    "status": "CONTACTED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Michele G.",
    "serviceType": "NHTD & TBI",
    "county": "RENSSELAER",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "UAS & Home Abstract Outstanding",
    "blockerNotes": "New Rensselaer HCSS referral requesting 48 hrs/week. Everything remains pending, including acceptance and intake steps. Kigi Services / Grace",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-26T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-22",
        "title": "Resolve UAS & Home Abstract Outstanding for Pending Pending",
        "description": "Operational Task: New Rensselaer HCSS referral requesting 48 hrs/week. Everything remains pending, including acceptance and intake steps. Kigi Services / Grace (SC: Michele G. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-22",
        "lead": {
          "id": "lead-aug28-22",
          "firstName": "Pending",
          "lastName": "Pending"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-22-nhtd-tbi",
        "leadId": "lead-aug28-22",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-22-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-22-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-22-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-22-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-22-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-22-1",
            "stageTemplateId": "stg-22-1",
            "stageTemplate": {
              "id": "stg-22-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-22-2",
            "stageTemplateId": "stg-22-2",
            "stageTemplate": {
              "id": "stg-22-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-22-3",
            "stageTemplateId": "stg-22-3",
            "stageTemplate": {
              "id": "stg-22-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-22-4",
            "stageTemplateId": "stg-22-4",
            "stageTemplate": {
              "id": "stg-22-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-22-5",
            "stageTemplateId": "stg-22-5",
            "stageTemplate": {
              "id": "stg-22-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-22-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: New Rensselaer HCSS referral requesting 48 hrs/week. Everything remains pending, including acceptance and intake steps. Kigi Services / Grace (Board: NHTD/TBI New Enrollment | Stage: New NHTD | SC Agency: Michele G. | Blocker: UAS & Home Abstract Outstanding)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-22-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-23",
    "jotformSubmissionId": "P-BYE59V6M6B",
    "firstName": "Devin",
    "lastName": "Stone",
    "name": "Devin Stone",
    "phone": "(518) 555-1023",
    "email": "devin.stone@example.com",
    "stage": "QUALIFIED",
    "status": "ON_HOLD",
    "source": "HCSS Agency Transfer",
    "referralSource": "HCSS Agency Transfer",
    "serviceCoordinator": "My Independence",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "UAS & Home Abstract Outstanding",
    "blockerNotes": "UAS done, Abstract scheduled 8/19. Caregiver Nakisha Howard (518-577-0387) assigned and ready; forms pending RRDC.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-27T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-23",
        "title": "Resolve UAS & Home Abstract Outstanding for Devin Stone",
        "description": "Operational Task: UAS done, Abstract scheduled 8/19. Caregiver Nakisha Howard (518-577-0387) assigned and ready; forms pending RRDC. (SC: My Independence | Board: HCSS Agency Transfer)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-23",
        "lead": {
          "id": "lead-aug28-23",
          "firstName": "Devin",
          "lastName": "Stone"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-23-nhtd-tbi",
        "leadId": "lead-aug28-23",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-23-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-23-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-23-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-23-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-23-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-23-1",
            "stageTemplateId": "stg-23-1",
            "stageTemplate": {
              "id": "stg-23-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-23-2",
            "stageTemplateId": "stg-23-2",
            "stageTemplate": {
              "id": "stg-23-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-23-3",
            "stageTemplateId": "stg-23-3",
            "stageTemplate": {
              "id": "stg-23-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-23-4",
            "stageTemplateId": "stg-23-4",
            "stageTemplate": {
              "id": "stg-23-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-23-5",
            "stageTemplateId": "stg-23-5",
            "stageTemplate": {
              "id": "stg-23-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-23-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: UAS done, Abstract scheduled 8/19. Caregiver Nakisha Howard (518-577-0387) assigned and ready; forms pending RRDC. (Board: HCSS Agency Transfer | Stage: Signed Forms Pending RRDC Approval | SC Agency: My Independence | Blocker: UAS & Home Abstract Outstanding)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-23-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Caregiver Nakisha Assigned (25-35h/wk)",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-24",
    "jotformSubmissionId": "P-C48VWWD50G",
    "firstName": "Colleen",
    "lastName": "Pending",
    "name": "Colleen Pending",
    "phone": "(518) 555-1024",
    "email": "colleen.pending@example.com",
    "stage": "CONTACTED",
    "status": "CONTACTED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Rebecca M.",
    "serviceType": "NHTD & TBI",
    "county": "GREENE",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "UAS & Home Abstract Outstanding",
    "blockerNotes": "New TBI case in Greene pending ISP. Documents for both home abstract and UAS are outstanding; existing staff member Veronica is identified. My Independence / Rebecca M.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-20T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-24",
        "title": "Resolve UAS & Home Abstract Outstanding for Colleen Pending",
        "description": "Operational Task: New TBI case in Greene pending ISP. Documents for both home abstract and UAS are outstanding; existing staff member Veronica is identified. My Independence / Rebecca M. (SC: Rebecca M. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-24",
        "lead": {
          "id": "lead-aug28-24",
          "firstName": "Colleen",
          "lastName": "Pending"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-24-nhtd-tbi",
        "leadId": "lead-aug28-24",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-24-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-24-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-24-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-24-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-24-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-24-1",
            "stageTemplateId": "stg-24-1",
            "stageTemplate": {
              "id": "stg-24-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-24-2",
            "stageTemplateId": "stg-24-2",
            "stageTemplate": {
              "id": "stg-24-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-24-3",
            "stageTemplateId": "stg-24-3",
            "stageTemplate": {
              "id": "stg-24-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-24-4",
            "stageTemplateId": "stg-24-4",
            "stageTemplate": {
              "id": "stg-24-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-24-5",
            "stageTemplateId": "stg-24-5",
            "stageTemplate": {
              "id": "stg-24-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-24-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: New TBI case in Greene pending ISP. Documents for both home abstract and UAS are outstanding; existing staff member Veronica is identified. My Independence / Rebecca M. (Board: NHTD/TBI New Enrollment | Stage: New NHTD | SC Agency: Rebecca M. | Blocker: UAS & Home Abstract Outstanding)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-24-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending Plan approval- HCSS via Addendum later",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-25",
    "jotformSubmissionId": "P-0DVYW3OC6V",
    "firstName": "Paul",
    "lastName": "Wied",
    "name": "Paul Wied",
    "phone": "(518) 555-1025",
    "email": "paul.wied@example.com",
    "stage": "IN_PROGRESS",
    "status": "IN_PROGRESS",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Unspecified",
    "serviceType": "NHTD & TBI",
    "county": "COLUMBIA",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "UAS & Home Abstract Outstanding",
    "blockerNotes": "Auth pending in Columbia for 40 hrs/week. NOD corrections remain open, and the member missed the service-coordinator signature visit; awaiting a rescheduled visit/update. My Independence / Rebecca McD.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-21T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-25",
        "title": "Resolve UAS & Home Abstract Outstanding for Paul Wied",
        "description": "Operational Task: Auth pending in Columbia for 40 hrs/week. NOD corrections remain open, and the member missed the service-coordinator signature visit; awaiting a rescheduled visit/update. My Independence / Rebecca McD. (SC: Unspecified | Board: Unqualified Audit)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-25",
        "lead": {
          "id": "lead-aug28-25",
          "firstName": "Paul",
          "lastName": "Wied"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-25-nhtd-tbi",
        "leadId": "lead-aug28-25",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-25-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-25-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-25-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-25-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-25-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-25-1",
            "stageTemplateId": "stg-25-1",
            "stageTemplate": {
              "id": "stg-25-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-25-2",
            "stageTemplateId": "stg-25-2",
            "stageTemplate": {
              "id": "stg-25-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-25-3",
            "stageTemplateId": "stg-25-3",
            "stageTemplate": {
              "id": "stg-25-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-25-4",
            "stageTemplateId": "stg-25-4",
            "stageTemplate": {
              "id": "stg-25-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-25-5",
            "stageTemplateId": "stg-25-5",
            "stageTemplate": {
              "id": "stg-25-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-25-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Auth pending in Columbia for 40 hrs/week. NOD corrections remain open, and the member missed the service-coordinator signature visit; awaiting a rescheduled visit/update. My Independence / Rebecca McD. (Board: Unqualified Audit | Stage: Pending RN Assessments | SC Agency: Unspecified | Blocker: UAS & Home Abstract Outstanding)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-25-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Expired UAS - SC having trouble getting Patient/family cooperation on process",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-26",
    "jotformSubmissionId": "P-Y0G4DMU2AK",
    "firstName": "Samuel",
    "lastName": "Franklin",
    "name": "Samuel Franklin",
    "phone": "(518) 555-1026",
    "email": "samuel.franklin@example.com",
    "stage": "CONTACTED",
    "status": "CONTACTED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Alicia D.",
    "serviceType": "NHTD & TBI",
    "county": "FRANKLIN",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Paperwork In Progress",
    "blockerNotes": "Lillian is actively closing out Samuel's intake phase to free capacity for Luis Gonzalez.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-22T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-26",
        "title": "Resolve Paperwork In Progress for Samuel Franklin",
        "description": "Operational Task: Lillian is actively closing out Samuel's intake phase to free capacity for Luis Gonzalez. (SC: Alicia D. | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-26",
        "lead": {
          "id": "lead-aug28-26",
          "firstName": "Samuel",
          "lastName": "Franklin"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-26-nhtd-tbi",
        "leadId": "lead-aug28-26",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-26-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-26-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-26-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-26-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-26-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-26-1",
            "stageTemplateId": "stg-26-1",
            "stageTemplate": {
              "id": "stg-26-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-26-2",
            "stageTemplateId": "stg-26-2",
            "stageTemplate": {
              "id": "stg-26-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-26-3",
            "stageTemplateId": "stg-26-3",
            "stageTemplate": {
              "id": "stg-26-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-26-4",
            "stageTemplateId": "stg-26-4",
            "stageTemplate": {
              "id": "stg-26-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-26-5",
            "stageTemplateId": "stg-26-5",
            "stageTemplate": {
              "id": "stg-26-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-26-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Lillian is actively closing out Samuel's intake phase to free capacity for Luis Gonzalez. (Board: NHTD/TBI New Enrollment | Stage: Closing Out Intake | SC Agency: Alicia D. | Blocker: Paperwork In Progress)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-26-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Jamaica",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-27",
    "jotformSubmissionId": "P-7J9XOE9LXN",
    "firstName": "Jennifer",
    "lastName": "S.",
    "name": "Jennifer S.",
    "phone": "(518) 555-1027",
    "email": "jennifer.s.@example.com",
    "stage": "UNQUALIFIED",
    "status": "UNQUALIFIED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Empire Community Services",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Paperwork In Progress",
    "blockerNotes": "Family requested pause due to life circumstances; wants to touch base later to move forward.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-23T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-27",
        "title": "Resolve Paperwork In Progress for Jennifer S.",
        "description": "Operational Task: Family requested pause due to life circumstances; wants to touch base later to move forward. (SC: Empire Community Services | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-27",
        "lead": {
          "id": "lead-aug28-27",
          "firstName": "Jennifer",
          "lastName": "S."
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-27-nhtd-tbi",
        "leadId": "lead-aug28-27",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-27-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-27-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-27-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-27-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-27-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "CLOSED",
        "stageInstances": [
          {
            "id": "si-27-1",
            "stageTemplateId": "stg-27-1",
            "stageTemplate": {
              "id": "stg-27-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-27-2",
            "stageTemplateId": "stg-27-2",
            "stageTemplate": {
              "id": "stg-27-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-27-3",
            "stageTemplateId": "stg-27-3",
            "stageTemplate": {
              "id": "stg-27-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-27-4",
            "stageTemplateId": "stg-27-4",
            "stageTemplate": {
              "id": "stg-27-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-27-5",
            "stageTemplateId": "stg-27-5",
            "stageTemplate": {
              "id": "stg-27-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-27-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Family requested pause due to life circumstances; wants to touch base later to move forward. (Board: NHTD/TBI New Enrollment | Stage: Cancelled | SC Agency: Empire Community Services | Blocker: Paperwork In Progress)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-27-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Pending SC paperwork & RRDC review.",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-28",
    "jotformSubmissionId": "P-2XIKKYKYJ1",
    "firstName": "John",
    "lastName": "Cannon",
    "name": "John Cannon",
    "phone": "(518) 555-1028",
    "email": "john.cannon@example.com",
    "stage": "QUALIFIED",
    "status": "ON_HOLD",
    "source": "HCSS Agency Transfer",
    "referralSource": "HCSS Agency Transfer",
    "serviceCoordinator": "Fort Hudson",
    "serviceType": "NHTD & TBI",
    "county": "WARREN",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Paperwork In Progress",
    "blockerNotes": "Vendor-change case in Warren with 40 hrs/week. Signed forms await RRDC approval; transfer form still needs signature. Fort Hudson reports an aide is ready; confirm whether home abstract/UAS are required. Jessica M.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-24T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-28",
        "title": "Resolve Paperwork In Progress for John Cannon",
        "description": "Operational Task: Vendor-change case in Warren with 40 hrs/week. Signed forms await RRDC approval; transfer form still needs signature. Fort Hudson reports an aide is ready; confirm whether home abstract/UAS are required. Jessica M. (SC: Fort Hudson | Board: HCSS Agency Transfer)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-28",
        "lead": {
          "id": "lead-aug28-28",
          "firstName": "John",
          "lastName": "Cannon"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-28-nhtd-tbi",
        "leadId": "lead-aug28-28",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-28-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-28-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-28-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-28-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-28-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-28-1",
            "stageTemplateId": "stg-28-1",
            "stageTemplate": {
              "id": "stg-28-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-28-2",
            "stageTemplateId": "stg-28-2",
            "stageTemplate": {
              "id": "stg-28-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-21T09:00:00.000Z",
            "completedAt": "2026-08-22T17:00:00.000Z",
            "dueAt": "2026-08-22T17:00:00.000Z"
          },
          {
            "id": "si-28-3",
            "stageTemplateId": "stg-28-3",
            "stageTemplate": {
              "id": "stg-28-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-28-4",
            "stageTemplateId": "stg-28-4",
            "stageTemplate": {
              "id": "stg-28-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-28-5",
            "stageTemplateId": "stg-28-5",
            "stageTemplate": {
              "id": "stg-28-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-28-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Vendor-change case in Warren with 40 hrs/week. Signed forms await RRDC approval; transfer form still needs signature. Fort Hudson reports an aide is ready; confirm whether home abstract/UAS are required. Jessica M. (Board: HCSS Agency Transfer | Stage: Signed Forms Pending RRDC Approval | SC Agency: Fort Hudson | Blocker: Paperwork In Progress)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-28-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: Death",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-29",
    "jotformSubmissionId": "P-0O6HB84F5F",
    "firstName": "Pending",
    "lastName": "Name",
    "name": "Pending Name",
    "phone": "(518) 555-1029",
    "email": "pending.name@example.com",
    "stage": "UNQUALIFIED",
    "status": "UNQUALIFIED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Jeffrey Mendoza / Mouna Ref",
    "serviceType": "NHTD & TBI",
    "county": "KINGS",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Paperwork In Progress",
    "blockerNotes": "Kings County referral via Mouna; pending applicant info from Liz vs 3 applicants; insurance inquiry open.",
    "riskLevel": "High",
    "riskScore": 65,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: true,
    "createdAt": "2026-08-25T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-27T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-29",
        "title": "Resolve Paperwork In Progress for Pending Name",
        "description": "Operational Task: Kings County referral via Mouna; pending applicant info from Liz vs 3 applicants; insurance inquiry open. (SC: Jeffrey Mendoza / Mouna Ref | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-27T17:00:00.000Z",
        "dueDate": "2026-08-27T17:00:00.000Z",
        "status": "OPEN",
        "priority": "URGENT",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-29",
        "lead": {
          "id": "lead-aug28-29",
          "firstName": "Pending",
          "lastName": "Name"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-29-nhtd-tbi",
        "leadId": "lead-aug28-29",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-29-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-29-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-29-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-29-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-29-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "CLOSED",
        "stageInstances": [
          {
            "id": "si-29-1",
            "stageTemplateId": "stg-29-1",
            "stageTemplate": {
              "id": "stg-29-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "COMPLETED",
            "startedAt": "2026-08-20T09:00:00.000Z",
            "completedAt": "2026-08-21T17:00:00.000Z",
            "dueAt": "2026-08-21T17:00:00.000Z"
          },
          {
            "id": "si-29-2",
            "stageTemplateId": "stg-29-2",
            "stageTemplate": {
              "id": "stg-29-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-27T17:00:00.000Z"
          },
          {
            "id": "si-29-3",
            "stageTemplateId": "stg-29-3",
            "stageTemplate": {
              "id": "stg-29-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-29-4",
            "stageTemplateId": "stg-29-4",
            "stageTemplate": {
              "id": "stg-29-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-29-5",
            "stageTemplateId": "stg-29-5",
            "stageTemplate": {
              "id": "stg-29-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-29-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Kings County referral via Mouna; pending applicant info from Liz vs 3 applicants; insurance inquiry open. (Board: NHTD/TBI New Enrollment | Stage: Stuck NHTD | SC Agency: Jeffrey Mendoza / Mouna Ref | Blocker: Paperwork In Progress)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-29-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: NYC",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-30",
    "jotformSubmissionId": "P-VR6AQUNJUR",
    "firstName": "Tamer",
    "lastName": "Gabriel",
    "name": "Tamer Gabriel",
    "phone": "(518) 555-1030",
    "email": "tamer.gabriel@example.com",
    "stage": "CONTACTED",
    "status": "CONTACTED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Unspecified",
    "serviceType": "NHTD & TBI",
    "county": "QUEENS",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Paperwork In Progress",
    "blockerNotes": "Queens intake referral was submitted. Waiting for participant contact / RRDC intake progress; Arabic-speaking case referred through Mouna and PCM.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-26T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-30",
        "title": "Resolve Paperwork In Progress for Tamer Gabriel",
        "description": "Operational Task: Queens intake referral was submitted. Waiting for participant contact / RRDC intake progress; Arabic-speaking case referred through Mouna and PCM. (SC: Unspecified | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-30",
        "lead": {
          "id": "lead-aug28-30",
          "firstName": "Tamer",
          "lastName": "Gabriel"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-30-nhtd-tbi",
        "leadId": "lead-aug28-30",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-30-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-30-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-30-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-30-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-30-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-30-1",
            "stageTemplateId": "stg-30-1",
            "stageTemplate": {
              "id": "stg-30-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-30-2",
            "stageTemplateId": "stg-30-2",
            "stageTemplate": {
              "id": "stg-30-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-30-3",
            "stageTemplateId": "stg-30-3",
            "stageTemplate": {
              "id": "stg-30-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-30-4",
            "stageTemplateId": "stg-30-4",
            "stageTemplate": {
              "id": "stg-30-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-30-5",
            "stageTemplateId": "stg-30-5",
            "stageTemplate": {
              "id": "stg-30-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-30-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Queens intake referral was submitted. Waiting for participant contact / RRDC intake progress; Arabic-speaking case referred through Mouna and PCM. (Board: NHTD/TBI New Enrollment | Stage: Calling RRDC for Intake | SC Agency: Unspecified | Blocker: Paperwork In Progress)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-30-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: NYC",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-31",
    "jotformSubmissionId": "P-0OI8SRF35E",
    "firstName": "Samir",
    "lastName": "Ayed",
    "name": "Samir Ayed",
    "phone": "(518) 555-1031",
    "email": "samir.ayed@example.com",
    "stage": "CONTACTED",
    "status": "CONTACTED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Unspecified",
    "serviceType": "NHTD & TBI",
    "county": "KINGS",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Paperwork In Progress",
    "blockerNotes": "Kings intake was referred to PCM. Client is contacting RRDC; awaiting confirmation that the case is accepted and the next intake step. Arabic-speaking case through Mouna.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-27T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-31",
        "title": "Resolve Paperwork In Progress for Samir Ayed",
        "description": "Operational Task: Kings intake was referred to PCM. Client is contacting RRDC; awaiting confirmation that the case is accepted and the next intake step. Arabic-speaking case through Mouna. (SC: Unspecified | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-31",
        "lead": {
          "id": "lead-aug28-31",
          "firstName": "Samir",
          "lastName": "Ayed"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-31-nhtd-tbi",
        "leadId": "lead-aug28-31",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-31-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-31-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-31-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-31-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-31-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-31-1",
            "stageTemplateId": "stg-31-1",
            "stageTemplate": {
              "id": "stg-31-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-31-2",
            "stageTemplateId": "stg-31-2",
            "stageTemplate": {
              "id": "stg-31-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-31-3",
            "stageTemplateId": "stg-31-3",
            "stageTemplate": {
              "id": "stg-31-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-31-4",
            "stageTemplateId": "stg-31-4",
            "stageTemplate": {
              "id": "stg-31-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-31-5",
            "stageTemplateId": "stg-31-5",
            "stageTemplate": {
              "id": "stg-31-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-31-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Kings intake was referred to PCM. Client is contacting RRDC; awaiting confirmation that the case is accepted and the next intake step. Arabic-speaking case through Mouna. (Board: NHTD/TBI New Enrollment | Stage: Calling RRDC for Intake | SC Agency: Unspecified | Blocker: Paperwork In Progress)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-31-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: NYC",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-32",
    "jotformSubmissionId": "P-1146JWVRLD",
    "firstName": "Joseph",
    "lastName": "Damien",
    "name": "Joseph Damien",
    "phone": "(518) 555-1032",
    "email": "joseph.damien@example.com",
    "stage": "CONTACTED",
    "status": "CONTACTED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Unspecified",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Paperwork In Progress",
    "blockerNotes": "Active MLTC patient (not returning client) seeking Waiver conversion for more care hours.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-20T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-29T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-32",
        "title": "Resolve Paperwork In Progress for Joseph Damien",
        "description": "Operational Task: Active MLTC patient (not returning client) seeking Waiver conversion for more care hours. (SC: Unspecified | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-29T17:00:00.000Z",
        "dueDate": "2026-08-29T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-32",
        "lead": {
          "id": "lead-aug28-32",
          "firstName": "Joseph",
          "lastName": "Damien"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-32-nhtd-tbi",
        "leadId": "lead-aug28-32",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-32-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-32-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-32-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-32-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-32-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-32-1",
            "stageTemplateId": "stg-32-1",
            "stageTemplate": {
              "id": "stg-32-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-29T17:00:00.000Z"
          },
          {
            "id": "si-32-2",
            "stageTemplateId": "stg-32-2",
            "stageTemplate": {
              "id": "stg-32-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-32-3",
            "stageTemplateId": "stg-32-3",
            "stageTemplate": {
              "id": "stg-32-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-32-4",
            "stageTemplateId": "stg-32-4",
            "stageTemplate": {
              "id": "stg-32-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-32-5",
            "stageTemplateId": "stg-32-5",
            "stageTemplate": {
              "id": "stg-32-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-32-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Active MLTC patient (not returning client) seeking Waiver conversion for more care hours. (Board: NHTD/TBI New Enrollment | Stage: Waiver Conversion Intake | SC Agency: Unspecified | Blocker: Paperwork In Progress)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-32-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: NYC",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  },
  {
    "id": "lead-aug28-33",
    "jotformSubmissionId": "P-H4FOOHPH8V",
    "firstName": "Ernest",
    "lastName": "Asiryan",
    "name": "Ernest Asiryan",
    "phone": "(518) 555-1033",
    "email": "ernest.asiryan@example.com",
    "stage": "CONTACTED",
    "status": "CONTACTED",
    "source": "NHTD Service Coordinator",
    "referralSource": "NHTD Service Coordinator",
    "serviceCoordinator": "Unspecified",
    "serviceType": "NHTD & TBI",
    "county": "ALBANY",
    "payerType": "Medicaid (Fee-for-Service)",
    "assignedTo": "Jeffrey Mendoza",
    "owner": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "blockerType": "Paperwork In Progress",
    "blockerNotes": "Active MLTC patient (not returning client) seeking Waiver conversion for more care hours. RRDC intake call scheduled.",
    "riskLevel": "Normal",
    "riskScore": 25,
    "totalCallAttempts": 2,
    isCheckbackTooFar: false,
    isCheckbackOverdue: false,
    "createdAt": "2026-08-21T12:00:00.000Z",
    "updatedAt": "2026-08-28T18:00:00.000Z",
    "checkbackDate": "2026-08-31T17:00:00.000Z",
    "tasks": [
      {
        "id": "task-aug28-33",
        "title": "Resolve Paperwork In Progress for Ernest Asiryan",
        "description": "Operational Task: Active MLTC patient (not returning client) seeking Waiver conversion for more care hours. RRDC intake call scheduled. (SC: Unspecified | Board: NHTD/TBI New Enrollment)",
        "dueAt": "2026-08-31T17:00:00.000Z",
        "dueDate": "2026-08-31T17:00:00.000Z",
        "status": "OPEN",
        "priority": "HIGH",
        "assignedTo": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        },
        "leadId": "lead-aug28-33",
        "lead": {
          "id": "lead-aug28-33",
          "firstName": "Ernest",
          "lastName": "Asiryan"
        }
      }
    ],
    "processInstances": [
      {
        "id": "pi-33-nhtd-tbi",
        "leadId": "lead-aug28-33",
        "processTemplateId": "tpl-2",
        "processTemplate": {
          "id": "tpl-2",
          "name": "NHTD / TBI Waiver Intake Workflow",
          "category": "WAIVER",
          "color": "#10b981",
          "description": "Specialized Nursing Home Transition & Diversion intake process.",
          "stages": [
            {
              "id": "stg-33-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            {
              "id": "stg-33-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            {
              "id": "stg-33-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            {
              "id": "stg-33-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            {
              "id": "stg-33-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            }
          ]
        },
        "status": "ACTIVE",
        "stageInstances": [
          {
            "id": "si-33-1",
            "stageTemplateId": "stg-33-1",
            "stageTemplate": {
              "id": "stg-33-1",
              "name": "Referral Intake",
              "dueDays": 1,
              isFinalStage: false
            },
            "status": "ACTIVE",
            "startedAt": "2026-08-25T09:00:00.000Z",
            "completedAt": null,
            "dueAt": "2026-08-31T17:00:00.000Z"
          },
          {
            "id": "si-33-2",
            "stageTemplateId": "stg-33-2",
            "stageTemplate": {
              "id": "stg-33-2",
              "name": "Initial Screening & Paperwork",
              "dueDays": 2,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-33-3",
            "stageTemplateId": "stg-33-3",
            "stageTemplate": {
              "id": "stg-33-3",
              "name": "Service Plan & Abstract (ISP)",
              "dueDays": 7,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-33-4",
            "stageTemplateId": "stg-33-4",
            "stageTemplate": {
              "id": "stg-33-4",
              "name": "RRDC Approval & NOD",
              "dueDays": 10,
              isFinalStage: false
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          },
          {
            "id": "si-33-5",
            "stageTemplateId": "stg-33-5",
            "stageTemplate": {
              "id": "stg-33-5",
              "name": "Start of Care (SOC)",
              "dueDays": 14,
              isFinalStage: true
            },
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "dueAt": null
          }
        ]
      }
    ],
    "updates": [
      {
        "id": "upd-aug28-33-1",
        "type": "STATUS_CHANGE",
        "content": "OPERATIONAL UPDATE: Active MLTC patient (not returning client) seeking Waiver conversion for more care hours. RRDC intake call scheduled. (Board: NHTD/TBI New Enrollment | Stage: Waiver Conversion Intake | SC Agency: Unspecified | Blocker: Paperwork In Progress)",
        "createdAt": "2026-08-28T18:00:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      },
      {
        "id": "upd-aug28-33-2",
        "type": "MANUAL_COMMENT",
        "content": "Clinical & Documentation Status: NYC",
        "createdAt": "2026-08-27T14:30:00.000Z",
        "createdBy": {
          "firstName": "Jeffrey",
          "lastName": "Mendoza"
        }
      }
    ]
  }
];

// Persistent state for demo/standalone operations
const defaultTasks: any[] = [
  {
    "id": "task-aug28-1",
    "title": "Resolve Aide / Staffing Matching for Edward Boykins",
    "description": "Operational Task: Reopened Greene 8 hr/wk case; applicant Jessica Vanwagen is not cooperating, stalling progress. (SC: A&T Healthcare | Board: Payer Auth Pending & SOC)",
    "dueAt": "2026-08-27T17:00:00.000Z",
    "dueDate": "2026-08-27T17:00:00.000Z",
    "status": "OPEN",
    "priority": "URGENT",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-01",
    "lead": {
      "id": "lead-aug28-01",
      "firstName": "Edward",
      "lastName": "Boykins"
    }
  },
  {
    "id": "task-aug28-2",
    "title": "Resolve Aide / Staffing Matching for Pending Name",
    "description": "Operational Task: Client located in Rensselaer requesting 24/7 care; pending more info on required intake steps to start. (SC: Chantal E. (VNHC) | Board: HCSS Agency Transfer)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-02",
    "lead": {
      "id": "lead-aug28-02",
      "firstName": "Pending",
      "lastName": "Name"
    }
  },
  {
    "id": "task-aug28-3",
    "title": "Resolve Aide / Staffing Matching for Katie Rebecca",
    "description": "Operational Task: Franklin County case pending ISP. Notes indicate Rebecca has another case in the region, but no concrete next step or document status is recorded; confirm ownership and required intake actions. My Independence / Rebecca McD. (SC: Rebecca McD. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-03",
    "lead": {
      "id": "lead-aug28-03",
      "firstName": "Katie",
      "lastName": "Rebecca"
    }
  },
  {
    "id": "task-aug28-4",
    "title": "Resolve Housing / Nursing Home Transition for Jennifer Adelson",
    "description": "Operational Task: New NHTD case in Greene. Client remains in a nursing home and cannot progress until housing is secured; expect a longer timeline. My Independence / Rebecca M. (SC: Rebecca M. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-04",
    "lead": {
      "id": "lead-aug28-04",
      "firstName": "Jennifer",
      "lastName": "Adelson"
    }
  },
  {
    "id": "task-aug28-5",
    "title": "Resolve Initial Referral Intake Step for John Gallo",
    "description": "Operational Task: CASE CANCELLED & CLOSED due to history of violent behavior (aggressive & sexual assault). (SC: Shelley Skellington (Marketer) | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-05",
    "lead": {
      "id": "lead-aug28-05",
      "firstName": "John",
      "lastName": "Gallo"
    }
  },
  {
    "id": "task-aug28-6",
    "title": "Resolve Provider Selection / Signature Missing for Pending Name",
    "description": "Operational Task: Pending provider selection form signature; SC visit scheduled in a month to finalize hour split with Fort Hudson. (SC: Erin S. (VNHC) | Board: HCSS Agency Transfer)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-06",
    "lead": {
      "id": "lead-aug28-06",
      "firstName": "Pending",
      "lastName": "Name"
    }
  },
  {
    "id": "task-aug28-7",
    "title": "Resolve Provider Selection / Signature Missing for Female Client (schenectady hcss)",
    "description": "Operational Task: 20h/day HCSS transfer case in Schenectady (2965 W Old State Rd). 1-person transfer pivot, wheelchair user. Needs follow up with Holly for CIN & form. (SC: Holly C. (Unlimited Care, Inc.) | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-07",
    "lead": {
      "id": "lead-aug28-07",
      "firstName": "Female",
      "lastName": "Client (schenectady hcss)"
    }
  },
  {
    "id": "task-aug28-8",
    "title": "Resolve Provider Selection / Signature Missing for Carolyn Jones",
    "description": "Operational Task: Pending client call to confirm required steps for agency switch request. (SC: Holly M. (Upstate Advocacy) | Board: HCSS Agency Transfer)",
    "dueAt": "2026-08-27T17:00:00.000Z",
    "dueDate": "2026-08-27T17:00:00.000Z",
    "status": "OPEN",
    "priority": "URGENT",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-08",
    "lead": {
      "id": "lead-aug28-08",
      "firstName": "Carolyn",
      "lastName": "Jones"
    }
  },
  {
    "id": "task-aug28-9",
    "title": "Resolve Provider Selection / Signature Missing for Luis Gonzalez",
    "description": "Operational Task: Aug 17 (Jeffrey Mendoza): Client confirmed PCP docs filled and mailed 2 wks ago. Zev & Lillian confirmed Spanish SC assignment. Lillian taking case after closing Samuel. (SC: Spanish SC Selected: Lillian | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-09",
    "lead": {
      "id": "lead-aug28-09",
      "firstName": "Luis",
      "lastName": "Gonzalez"
    }
  },
  {
    "id": "task-aug28-10",
    "title": "Resolve Provider Selection / Signature Missing for Deborah L.",
    "description": "Operational Task: New NHTD lead in Rensselaer. Intake is at the earliest stage with all documentation and coordination still pending; family communication is noted as difficult. No coordinator assigned. (SC: Unspecified | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-10",
    "lead": {
      "id": "lead-aug28-10",
      "firstName": "Deborah",
      "lastName": "L."
    }
  },
  {
    "id": "task-aug28-11",
    "title": "Resolve RRDC Approval Pending for Sheila Morehouse",
    "description": "Operational Task: NOD pending NHTD case in Warren for roughly 12\u201324 hrs/week. Home abstract and UAS are outstanding; recent fall/PT involvement is noted. Fort Hudson / Dianne C. (SC: Dianne C. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-11",
    "lead": {
      "id": "lead-aug28-11",
      "firstName": "Sheila",
      "lastName": "Morehouse"
    }
  },
  {
    "id": "task-aug28-12",
    "title": "Resolve RRDC Approval Pending for David Weeks",
    "description": "Operational Task: NOD pending in Schenectady for 16 hrs/week. NOD corrections, home abstract, and UAS remain outstanding. Upstate Advocacy / Holly M. (SC: Holly M. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-12",
    "lead": {
      "id": "lead-aug28-12",
      "firstName": "David",
      "lastName": "Weeks"
    }
  },
  {
    "id": "task-aug28-13",
    "title": "Resolve RRDC Approval Pending for Shirley Swears",
    "description": "Operational Task: NOD pending NHTD case in Saratoga. CIN and medical notes are needed before requesting the home abstract/UAS; an addendum is also required. Fort Hudson / Joann W. (SC: Joann W. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-13",
    "lead": {
      "id": "lead-aug28-13",
      "firstName": "Shirley",
      "lastName": "Swears"
    }
  },
  {
    "id": "task-aug28-14",
    "title": "Resolve RRDC Approval Pending for Esther Washburn",
    "description": "Operational Task: Received Notice of Decision (NOD) for Start of Care (SOC) effective 8/20/2026. 49 hrs/wk; active caregiver Lisa Marpe ready. (SC: Kigi Services | Board: Payer Auth Pending & SOC)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-14",
    "lead": {
      "id": "lead-aug28-14",
      "firstName": "Esther",
      "lastName": "Washburn"
    }
  },
  {
    "id": "task-aug28-15",
    "title": "Resolve RRDC Approval Pending for Annie Wilson",
    "description": "Operational Task: Pending new NOD post county transfer with 7x12 schedule (84 hrs/wk). Target SOC was Aug 17. (SC: Prompt | Board: Payer Auth Pending & SOC)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-15",
    "lead": {
      "id": "lead-aug28-15",
      "firstName": "Annie",
      "lastName": "Wilson"
    }
  },
  {
    "id": "task-aug28-16",
    "title": "Resolve Service Coordination Paperwork In Progress/Missing for Cynthia Kelsay",
    "description": "Operational Task: Warren shared-hours case awaiting RRDC approval; provider selection form pending with SC for female weekend coverage. (SC: Unspecified | Board: Unqualified Audit)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-16",
    "lead": {
      "id": "lead-aug28-16",
      "firstName": "Cynthia",
      "lastName": "Kelsay"
    }
  },
  {
    "id": "task-aug28-17",
    "title": "Resolve UAS & Home Abstract Outstanding for Filomena Egan",
    "description": "Operational Task: New Albany NHTD case pending ISP. UAS is complete; home abstract remains outstanding. Kigi Services / Anna Y. (SC: Anna Y. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-17",
    "lead": {
      "id": "lead-aug28-17",
      "firstName": "Filomena",
      "lastName": "Egan"
    }
  },
  {
    "id": "task-aug28-18",
    "title": "Resolve UAS & Home Abstract Outstanding for Judy Bradt",
    "description": "Operational Task: Pending ISP in Albany for 10\u201315 hrs/week. UAS, home abstract, and provider selection form are outstanding; follow up with Kim. VNHC / Erin S. (SC: Erin S. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-18",
    "lead": {
      "id": "lead-aug28-18",
      "firstName": "Judy",
      "lastName": "Bradt"
    }
  },
  {
    "id": "task-aug28-19",
    "title": "Resolve UAS & Home Abstract Outstanding for Glenn Tryon",
    "description": "Operational Task: Schenectady TBI case. Abstract & UAS scheduling through Epilepsy Center for week of Aug 24. (SC: Jeff R. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-19",
    "lead": {
      "id": "lead-aug28-19",
      "firstName": "Glenn",
      "lastName": "Tryon"
    }
  },
  {
    "id": "task-aug28-20",
    "title": "Resolve UAS & Home Abstract Outstanding for Kimberly Hogan",
    "description": "Operational Task: URGENT RRDC NOTICE: RRDC has a discontinuance happening unless Revised Service Plan (RSP) is submitted by 8/31/2026. CDPAP conversion in Albany; HCSS caregiver cannot be Steven Elting. (SC: Kevin O. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-27T17:00:00.000Z",
    "dueDate": "2026-08-27T17:00:00.000Z",
    "status": "OPEN",
    "priority": "URGENT",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-20",
    "lead": {
      "id": "lead-aug28-20",
      "firstName": "Kimberly",
      "lastName": "Hogan"
    }
  },
  {
    "id": "task-aug28-21",
    "title": "Resolve UAS & Home Abstract Outstanding for Martin Finn",
    "description": "Operational Task: Vendor change in Albany (6 hrs/wk). Home Abstract visit scheduled for Aug 21. (SC: Living resources | Board: HCSS Agency Transfer)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-21",
    "lead": {
      "id": "lead-aug28-21",
      "firstName": "Martin",
      "lastName": "Finn"
    }
  },
  {
    "id": "task-aug28-22",
    "title": "Resolve UAS & Home Abstract Outstanding for Pending Pending",
    "description": "Operational Task: New Rensselaer HCSS referral requesting 48 hrs/week. Everything remains pending, including acceptance and intake steps. Kigi Services / Grace (SC: Michele G. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-22",
    "lead": {
      "id": "lead-aug28-22",
      "firstName": "Pending",
      "lastName": "Pending"
    }
  },
  {
    "id": "task-aug28-23",
    "title": "Resolve UAS & Home Abstract Outstanding for Devin Stone",
    "description": "Operational Task: UAS done, Abstract scheduled 8/19. Caregiver Nakisha Howard (518-577-0387) assigned and ready; forms pending RRDC. (SC: My Independence | Board: HCSS Agency Transfer)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-23",
    "lead": {
      "id": "lead-aug28-23",
      "firstName": "Devin",
      "lastName": "Stone"
    }
  },
  {
    "id": "task-aug28-24",
    "title": "Resolve UAS & Home Abstract Outstanding for Colleen Pending",
    "description": "Operational Task: New TBI case in Greene pending ISP. Documents for both home abstract and UAS are outstanding; existing staff member Veronica is identified. My Independence / Rebecca M. (SC: Rebecca M. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-24",
    "lead": {
      "id": "lead-aug28-24",
      "firstName": "Colleen",
      "lastName": "Pending"
    }
  },
  {
    "id": "task-aug28-25",
    "title": "Resolve UAS & Home Abstract Outstanding for Paul Wied",
    "description": "Operational Task: Auth pending in Columbia for 40 hrs/week. NOD corrections remain open, and the member missed the service-coordinator signature visit; awaiting a rescheduled visit/update. My Independence / Rebecca McD. (SC: Unspecified | Board: Unqualified Audit)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-25",
    "lead": {
      "id": "lead-aug28-25",
      "firstName": "Paul",
      "lastName": "Wied"
    }
  },
  {
    "id": "task-aug28-26",
    "title": "Resolve Paperwork In Progress for Samuel Franklin",
    "description": "Operational Task: Lillian is actively closing out Samuel's intake phase to free capacity for Luis Gonzalez. (SC: Alicia D. | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-26",
    "lead": {
      "id": "lead-aug28-26",
      "firstName": "Samuel",
      "lastName": "Franklin"
    }
  },
  {
    "id": "task-aug28-27",
    "title": "Resolve Paperwork In Progress for Jennifer S.",
    "description": "Operational Task: Family requested pause due to life circumstances; wants to touch base later to move forward. (SC: Empire Community Services | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-27",
    "lead": {
      "id": "lead-aug28-27",
      "firstName": "Jennifer",
      "lastName": "S."
    }
  },
  {
    "id": "task-aug28-28",
    "title": "Resolve Paperwork In Progress for John Cannon",
    "description": "Operational Task: Vendor-change case in Warren with 40 hrs/week. Signed forms await RRDC approval; transfer form still needs signature. Fort Hudson reports an aide is ready; confirm whether home abstract/UAS are required. Jessica M. (SC: Fort Hudson | Board: HCSS Agency Transfer)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-28",
    "lead": {
      "id": "lead-aug28-28",
      "firstName": "John",
      "lastName": "Cannon"
    }
  },
  {
    "id": "task-aug28-29",
    "title": "Resolve Paperwork In Progress for Pending Name",
    "description": "Operational Task: Kings County referral via Mouna; pending applicant info from Liz vs 3 applicants; insurance inquiry open. (SC: Jeffrey Mendoza / Mouna Ref | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-27T17:00:00.000Z",
    "dueDate": "2026-08-27T17:00:00.000Z",
    "status": "OPEN",
    "priority": "URGENT",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-29",
    "lead": {
      "id": "lead-aug28-29",
      "firstName": "Pending",
      "lastName": "Name"
    }
  },
  {
    "id": "task-aug28-30",
    "title": "Resolve Paperwork In Progress for Tamer Gabriel",
    "description": "Operational Task: Queens intake referral was submitted. Waiting for participant contact / RRDC intake progress; Arabic-speaking case referred through Mouna and PCM. (SC: Unspecified | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-30",
    "lead": {
      "id": "lead-aug28-30",
      "firstName": "Tamer",
      "lastName": "Gabriel"
    }
  },
  {
    "id": "task-aug28-31",
    "title": "Resolve Paperwork In Progress for Samir Ayed",
    "description": "Operational Task: Kings intake was referred to PCM. Client is contacting RRDC; awaiting confirmation that the case is accepted and the next intake step. Arabic-speaking case through Mouna. (SC: Unspecified | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-31",
    "lead": {
      "id": "lead-aug28-31",
      "firstName": "Samir",
      "lastName": "Ayed"
    }
  },
  {
    "id": "task-aug28-32",
    "title": "Resolve Paperwork In Progress for Joseph Damien",
    "description": "Operational Task: Active MLTC patient (not returning client) seeking Waiver conversion for more care hours. (SC: Unspecified | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-29T17:00:00.000Z",
    "dueDate": "2026-08-29T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-32",
    "lead": {
      "id": "lead-aug28-32",
      "firstName": "Joseph",
      "lastName": "Damien"
    }
  },
  {
    "id": "task-aug28-33",
    "title": "Resolve Paperwork In Progress for Ernest Asiryan",
    "description": "Operational Task: Active MLTC patient (not returning client) seeking Waiver conversion for more care hours. RRDC intake call scheduled. (SC: Unspecified | Board: NHTD/TBI New Enrollment)",
    "dueAt": "2026-08-31T17:00:00.000Z",
    "dueDate": "2026-08-31T17:00:00.000Z",
    "status": "OPEN",
    "priority": "HIGH",
    "assignedTo": {
      "firstName": "Jeffrey",
      "lastName": "Mendoza"
    },
    "leadId": "lead-aug28-33",
    "lead": {
      "id": "lead-aug28-33",
      "firstName": "Ernest",
      "lastName": "Asiryan"
    }
  }
];

const mockState: {
  user: { id: string; firstName: string; lastName: string; name: string; email: string; role: string; department?: string; isActive?: boolean };
  token: string;
  settings: Record<string, any>;
  leads: LeadItem[];
  tasks: any[];
  activity: any[];
  users: any[];
} = {
  user: { id: 'usr-1', firstName: 'Jeffrey', lastName: 'Mendoza', name: 'Jeffrey Mendoza', email: 'jmendoza@homecare4all.org', role: 'ADMIN', department: 'Intake Management', isActive: true },
  token: 'mock-jwt-token-jeffrey-mendoza',
  settings: {
    risk_weights: {
      ageWeight: 0.5,
      overdueTaskWeight: 15,
      missingDemoWeight: 10,
      farFutureCheckbackWeight: 15,
      inactiveWeight: 20
    }
  },
  leads: defaultLeads,
  users: [
    { id: 'usr-1', firstName: 'Jeffrey', lastName: 'Mendoza', name: 'Jeffrey Mendoza', email: 'jmendoza@homecare4all.org', role: 'ADMIN', department: 'Intake Management', isActive: true },
    { id: 'usr-2', firstName: 'Zevi', lastName: 'Spiegel', name: 'Zevi Spiegel', email: 'zspiegel@homecare4all.org', role: 'MANAGER', department: 'Clinical Intake', isActive: true }
  ],
  tasks: defaultTasks,
  activity: []
};

// Initialize persistent local storage for leads, tasks & activity
if (typeof window !== 'undefined') {
  try {
    const savedLeads = localStorage.getItem('intake_crm_leads');
    if (savedLeads) {
      const parsed = JSON.parse(savedLeads);
      if (Array.isArray(parsed) && parsed.length > 0) {
        mockState.leads = parsed;
      }
    }
    const savedTasks = localStorage.getItem('intake_crm_tasks');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
        mockState.tasks = parsedTasks;
      }
    }
  } catch (err) {
    console.error('[LocalStorage Load Error]', err);
  }
}

function saveLeadsToStorage() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('intake_crm_leads', JSON.stringify(mockState.leads));
      localStorage.setItem('intake_crm_tasks', JSON.stringify(mockState.tasks));
    } catch {}
  }
}

async function apiFetch(path: string, options: FetchOptions = {}) {
  const { token, ...fetchOpts } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...fetchOpts,
      headers,
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[API Client] Remote backend call to ${path} failed. Switching to local state fallback.`, err);
  }

  // Local fallback response handler to ensure zero UI downtime
  return handleMockFallback(path, fetchOpts);
}

function handleMockFallback(path: string, options: RequestInit) {
  const method = options.method || 'GET';

  if (path.includes('/api/auth/login')) {
    return { token: mockState.token, user: mockState.user };
  }
  if (path.includes('/api/auth/me')) {
    return { user: mockState.user };
  }
  if (path.includes('/api/dashboard/stats')) {
    return {
      counts: {
        totalLeads: mockState.leads.length,
        activePatients: mockState.leads.filter(l => l.status === 'ACTIVE' || l.stage === 'ACTIVE_PATIENT').length,
        newLeadsToday: mockState.leads.filter(l => l.stage === 'NEW' || l.status === 'NEW').length,
        openTasks: mockState.tasks.filter(t => t.status === 'OPEN').length,
        overdueTasks: mockState.tasks.filter(t => t.status === 'OPEN' && t.dueAt && new Date(t.dueAt) < new Date()).length,
        activeProcesses: 2
      },
      kpis: {
        contactAttemptCompliance: 98.5,
        staleNewLeads: 0,
        qualificationRate: 92.0,
        conversionRate: 33.3
      },
      leadsByStatus: {
        NEW: mockState.leads.filter(l => l.stage === 'NEW' || l.status === 'NEW').length,
        ATTEMPTING_CONTACT: mockState.leads.filter(l => l.stage === 'ATTEMPTING_CONTACT' || l.status === 'ATTEMPTING_CONTACT').length,
        CONTACTED: mockState.leads.filter(l => l.stage === 'CONTACTED' || l.status === 'CONTACTED').length,
        QUALIFIED: mockState.leads.filter(l => l.stage === 'QUALIFIED' || l.status === 'QUALIFIED').length,
        ACTIVE_PATIENT: mockState.leads.filter(l => l.stage === 'ACTIVE_PATIENT' || l.status === 'ACTIVE_PATIENT' || l.status === 'ACTIVE').length,
        ON_HOLD: mockState.leads.filter(l => l.status === 'ON_HOLD').length,
        DISCHARGED: mockState.leads.filter(l => l.status === 'DISCHARGED').length,
        UNQUALIFIED: mockState.leads.filter(l => l.stage === 'UNQUALIFIED' || l.status === 'UNQUALIFIED').length
      }
    };
  }
  if (path.includes('/api/dashboard/recent-activity')) {
    return mockState.activity;
  }
  if (path.includes('/api/dashboard/pipeline') || path.includes('/api/pipeline') || path.includes('/api/processes/pipeline')) {
    return {
      NEW: mockState.leads.filter(l => l.stage === 'NEW' || l.status === 'NEW'),
      ATTEMPTING_CONTACT: mockState.leads.filter(l => l.stage === 'ATTEMPTING_CONTACT' || l.status === 'ATTEMPTING_CONTACT'),
      CONTACTED: mockState.leads.filter(l => l.stage === 'CONTACTED' || l.status === 'CONTACTED'),
      QUALIFIED: mockState.leads.filter(l => l.stage === 'QUALIFIED' || l.status === 'QUALIFIED'),
      ACTIVE_PATIENT: mockState.leads.filter(l => l.stage === 'ACTIVE_PATIENT' || l.status === 'ACTIVE_PATIENT' || l.status === 'ACTIVE'),
      ON_HOLD: mockState.leads.filter(l => l.status === 'ON_HOLD'),
      DISCHARGED: mockState.leads.filter(l => l.status === 'DISCHARGED'),
      UNQUALIFIED: mockState.leads.filter(l => l.stage === 'UNQUALIFIED' || l.status === 'UNQUALIFIED')
    };
  }
  if (path.includes('/api/processes/templates')) {
    return defaultTemplates;
  }

  // Processes Execution Fallback
  if (path.includes('/api/processes')) {
    if (path.includes('/start') && method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const targetLead = mockState.leads.find(l => l.id === body.leadId) || mockState.leads[0];
      const template = defaultTemplates.find(t => t.id === body.processTemplateId) || defaultTemplates[0];

      const newInstance = {
        id: `pi-${Date.now()}`,
        leadId: targetLead.id,
        processTemplateId: template.id,
        processTemplate: template,
        status: 'ACTIVE',
        stageInstances: template.stages.map((stg: any, idx: number) => ({
          id: `si-${Date.now()}-${idx}`,
          stageTemplateId: stg.id,
          stageTemplate: { ...stg, isFinalStage: idx === template.stages.length - 1 },
          status: idx === 0 ? 'ACTIVE' : 'PENDING',
          startedAt: idx === 0 ? new Date().toISOString() : null,
          dueAt: idx === 0 ? new Date(Date.now() + stg.dueDays * 86400000).toISOString() : null
        }))
      };

      if (!targetLead.processInstances) targetLead.processInstances = [];
      targetLead.processInstances.unshift(newInstance);

      if (!targetLead.updates) targetLead.updates = [];
      targetLead.updates.unshift({
        id: `upd-${Date.now()}`,
        type: 'PROCESS_STARTED',
        content: `Started process workflow: "${template.name}"`,
        createdAt: new Date().toISOString(),
        createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName }
      });

      saveLeadsToStorage();
      return newInstance;
    }

    if (path.includes('/advance') && method === 'POST') {
      const instanceId = path.split('/processes/')[1].split('/advance')[0];
      for (const lead of mockState.leads) {
        if (lead.processInstances) {
          const inst = lead.processInstances.find((pi: any) => pi.id === instanceId);
          if (inst) {
            const activeIdx = inst.stageInstances.findIndex((si: any) => si.status === 'ACTIVE');
            if (activeIdx !== -1) {
              inst.stageInstances[activeIdx].status = 'COMPLETED';
              inst.stageInstances[activeIdx].completedAt = new Date().toISOString();
              if (activeIdx + 1 < inst.stageInstances.length) {
                inst.stageInstances[activeIdx + 1].status = 'ACTIVE';
                inst.stageInstances[activeIdx + 1].startedAt = new Date().toISOString();
                const dueDays = inst.stageInstances[activeIdx + 1].stageTemplate.dueDays || 2;
                inst.stageInstances[activeIdx + 1].dueAt = new Date(Date.now() + dueDays * 86400000).toISOString();
              } else {
                inst.status = 'CLOSED';
                inst.outcome = 'WON';
              }
            }
            saveLeadsToStorage();
            return inst;
          }
        }
      }
    }

    if (path.includes('/close') && method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const instanceId = path.split('/processes/')[1].split('/close')[0];
      for (const lead of mockState.leads) {
        if (lead.processInstances) {
          const inst = lead.processInstances.find((pi: any) => pi.id === instanceId);
          if (inst) {
            inst.status = 'CLOSED';
            inst.outcome = body.outcome || 'WON';
            inst.closedAt = new Date().toISOString();
            if (body.lostReason) inst.lostReason = body.lostReason;
            saveLeadsToStorage();
            return inst;
          }
        }
      }
    }
  }

  // Updates & Timeline endpoint handling
  if (path.includes('/api/updates')) {
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const targetLeadId = body.leadId || body.lead?.id;
      const targetLead = mockState.leads.find(l => l.id === targetLeadId) || mockState.leads[0];
      
      const newUpdate: TimelineUpdate = {
        id: `upd-${Date.now()}`,
        type: body.type || 'MANUAL_COMMENT',
        content: body.content || body.notes || 'Timeline update added',
        createdAt: new Date().toISOString(),
        createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName },
        leadId: targetLead ? targetLead.id : undefined
      };

      if (targetLead) {
        if (!targetLead.updates) targetLead.updates = [];
        targetLead.updates.unshift(newUpdate);
        targetLead.updatedAt = new Date().toISOString();
      }

      mockState.activity.unshift({
        id: newUpdate.id,
        type: newUpdate.type,
        content: newUpdate.content,
        createdAt: newUpdate.createdAt,
        createdBy: newUpdate.createdBy,
        lead: targetLead ? { id: targetLead.id, firstName: targetLead.firstName, lastName: targetLead.lastName } : null
      });

      saveLeadsToStorage();
      return newUpdate;
    }

    const urlObj = new URL(path, 'http://localhost');
    const qLeadId = urlObj.searchParams.get('leadId');
    if (qLeadId) {
      const targetLead = mockState.leads.find(l => l.id === qLeadId);
      return targetLead?.updates || [];
    }
    return mockState.activity;
  }

  if (path.includes('/api/leads')) {
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1].split('?')[0];

    if (method === 'PATCH' && lastPart && lastPart !== 'leads') {
      const body = JSON.parse((options.body as string) || '{}');
      const idx = mockState.leads.findIndex(l => l.id === lastPart);
      if (idx !== -1) {
        mockState.leads[idx] = { ...mockState.leads[idx], ...body, updatedAt: new Date().toISOString() };
        
        // Log status change or update into lead.updates
        if (body.status || body.lostReason || body.blockerType) {
          if (!mockState.leads[idx].updates) mockState.leads[idx].updates = [];
          const statusText = body.status ? `Status updated to ${body.status}` : '';
          const reasonText = body.lostReason ? ` (Reason: ${body.lostReason})` : '';
          const blockerText = body.blockerType ? ` (Blocker: ${body.blockerType})` : '';
          
          mockState.leads[idx].updates!.unshift({
            id: `upd-${Date.now()}`,
            type: 'STATUS_CHANGE',
            content: `${statusText}${reasonText}${blockerText}`.trim(),
            createdAt: new Date().toISOString(),
            createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName },
            leadId: lastPart
          });
        }
        
        saveLeadsToStorage();
        return mockState.leads[idx];
      }
    }
    if (method === 'POST' && path.includes('/activity')) {
      const body = JSON.parse((options.body as string) || '{}');
      const leadId = parts[parts.length - 2];
      const lead = mockState.leads.find(l => l.id === leadId);
      const newAct: TimelineUpdate = {
        id: `act-${Date.now()}`,
        type: body.type || 'NOTE',
        content: body.content || body.notes || 'Activity recorded',
        createdAt: new Date().toISOString(),
        createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName },
        leadId: leadId
      };
      if (lead) {
        if (!lead.updates) lead.updates = [];
        lead.updates.unshift(newAct);
      }
      mockState.activity.unshift(newAct);
      saveLeadsToStorage();
      return newAct;
    }
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const nameParts = (body.name || `${body.firstName || 'New'} ${body.lastName || 'Intake'}`).split(' ');
      const newLead: LeadItem = {
        id: `lead-${Date.now()}`,
        firstName: body.firstName || nameParts[0] || 'New',
        lastName: body.lastName || nameParts.slice(1).join(' ') || 'Intake',
        name: body.name || `${body.firstName || 'New'} ${body.lastName || 'Intake'}`,
        phone: body.phone || '555-000-0000',
        email: body.email || 'intake@example.com',
        stage: body.stage || body.status || 'NEW',
        status: body.status || body.stage || 'NEW',
        source: body.source || 'PHONE_INQUIRY',
        serviceType: body.serviceType || 'HHA/PCA',
        county: body.county || 'KINGS',
        payerType: body.payerType || 'MEDICAID',
        totalCallAttempts: 0,
        owner: { firstName: mockState.user.firstName, lastName: mockState.user.lastName },
        blockerType: body.blockerType || null,
        blockerNotes: body.blockerNotes || null,
        riskLevel: 'Normal',
        riskScore: 10,
        assignedTo: mockState.user.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checkbackDate: null,
        isCheckbackTooFar: false,
        isCheckbackOverdue: false,
        processInstances: [],
        updates: [
          {
            id: `upd-${Date.now()}`,
            type: 'INTAKE_CREATED',
            content: 'Lead profile created in Intake CRM.',
            createdAt: new Date().toISOString(),
            createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName }
          }
        ]
      };
      mockState.leads.unshift(newLead);
      saveLeadsToStorage();
      return newLead;
    }
    if (method === 'GET' && lastPart && lastPart !== 'leads' && !lastPart.includes('?')) {
      const lead = mockState.leads.find(l => l.id === lastPart);
      if (lead) {
        if (!lead.updates) lead.updates = [];
        if (!lead.processInstances) lead.processInstances = [];
        return lead;
      }
    }
    return { leads: mockState.leads, total: mockState.leads.length };
  }
  if (path.includes('/api/tasks')) {
    if (path.includes('/summary')) {
      return { total: mockState.tasks.length, open: mockState.tasks.filter(t => t.status === 'OPEN').length };
    }
    return { tasks: mockState.tasks };
  }
  if (path.includes('/api/users')) {
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const newUser = {
        id: `usr-${Date.now()}`,
        firstName: body.firstName || 'New',
        lastName: body.lastName || 'User',
        name: `${body.firstName || 'New'} ${body.lastName || 'User'}`,
        email: body.email || 'user@homecare4all.org',
        role: body.role || 'COORDINATOR',
        department: body.department || 'Intake',
        isActive: true
      };
      mockState.users.push(newUser);
      return newUser;
    }
    return mockState.users;
  }
  if (path.includes('/api/performance')) {
    return { conversionRate: '33%', avgIntakeHours: 4.2 };
  }
  if (path.includes('/api/settings')) {
    const key = path.split('/').pop();
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      if (key) (mockState.settings as any)[key] = body.value;
      return { success: true, value: body.value };
    }
    const val = (mockState.settings as any)[key || ''] || mockState.settings.risk_weights;
    return { key, value: val };
  }

  return { success: true };
}


// Intelligent Tasking & Risk Calculation Engine

export const DEFAULT_PRE_ASSESSMENT_COACHING_LINGO =
  "Confirmed applicant/family pre-assessment coaching completed prior to clinical assessment visit. Reviewed evaluation criteria, ADL/IADL assessment expectations, caregiver attendance requirements, and Waiver program participation terms.";

export interface DropdownLists {
  referralSources: string[];
  serviceCoordinators: string[];
  blockerTypes: string[];
  counties: string[];
  serviceTypes: string[];
  payerTypes: string[];
  lossReasons: string[];
}

export const defaultDropdowns: DropdownLists = {
  referralSources: [
    'NHTD Service Coordinator',
    'HCSS Agency Transfer',
    'Hospital Discharge',
    'Community Referral',
    'Social Worker',
    'Self / Family Referral',
    'Physician Office'
  ],
  serviceCoordinators: [
    'A&T Healthcare',
    'VNHC',
    'My Independence',
    'Upstate Advocacy',
    'Unlimited Care, Inc.',
    'Fort Hudson',
    'Kigi Services',
    'Prompt',
    'Epilepsy Center',
    'Living Resources',
    'Empire Community Services'
  ],
  blockerTypes: [
    'Aide / Staffing Matching',
    'RRDC Approval Pending',
    'UAS & Home Abstract Outstanding',
    'Provider Selection / Signature Missing',
    'Service Coordination Paperwork In Progress/Missing',
    'Insurance Inquiry / Medicaid Verification',
    'Behavioral Safety Evaluation',
    'NFLOC Score Mismatch'
  ],
  counties: [
    'ALBANY',
    'RENSSELAER',
    'SCHENECTADY',
    'WARREN',
    'SARATOGA',
    'GREENE',
    'COLUMBIA',
    'FRANKLIN',
    'KINGS',
    'QUEENS',
    'BRONX',
    'NEW YORK',
    'JEFFERSON'
  ],
  serviceTypes: [
    'NHTD & TBI',
    'HHA/PCA',
    'CDPAP',
    'Traditional Home Care',
    'Private Duty Nursing'
  ],
  payerTypes: [
    'Medicaid (Fee-for-Service)',
    'MLTC',
    'Medicare',
    'Private Pay',
    'Commercial Insurance'
  ],
  lossReasons: [
    'Patient Opted Out / Declined',
    'Deceased',
    'Moved Out of Service Area',
    'Unresponsive / Unable to Contact',
    'Ineligible for Waiver Services',
    'Selected Other Provider'
  ]
};


export function runIntelligentTaskingEngine(leads: LeadItem[]): { leads: LeadItem[]; tasks: any[] } {
  const allTasks: any[] = [...(mockState.tasks || [])];

  for (const lead of leads) {
    let calculatedRisk = 20;

    // Checkback date calculations
    if (lead.checkbackDate) {
      const checkDate = new Date(lead.checkbackDate);
      const now = new Date();
      if (checkDate < now) {
        lead.isCheckbackOverdue = true;
        calculatedRisk += 25;
      } else {
        lead.isCheckbackOverdue = false;
      }
    }

    // Blocker risk weight
    if (lead.blockerType) {
      calculatedRisk += 20;
    }

    // Stage risk weight
    if (lead.status === 'ON_HOLD') {
      calculatedRisk += 25;
    } else if (lead.status === 'ATTEMPTING_CONTACT' || lead.stage === 'CONTACTED') {
      calculatedRisk += 15;
    }

    if (lead.riskLevel === 'Critical') calculatedRisk = Math.max(calculatedRisk, 85);
    else if (lead.riskLevel === 'High') calculatedRisk = Math.max(calculatedRisk, 65);

    lead.riskScore = Math.min(calculatedRisk, 100);

    // Auto-generate or sync intelligent task for lead blocker/followup if missing
    if (lead.blockerType || lead.isCheckbackOverdue) {
      const taskTitle = lead.blockerType 
        ? `Resolve ${lead.blockerType} for ${lead.name}`
        : `Check back with ${lead.name} (Overdue Checkback)`;
      
      const existingTask = allTasks.find(t => t.leadId === lead.id || (t.lead && t.lead.id === lead.id));
      if (!existingTask) {
        const newTask = {
          id: `task-intel-${lead.id}`,
          title: taskTitle,
          description: `Intelligent Task: ${lead.blockerNotes || 'Follow up required on lead progress.'} (SC: ${lead.serviceCoordinator || 'Unassigned'} | County: ${lead.county})`,
          dueAt: lead.checkbackDate || new Date(Date.now() + 86400000).toISOString(),
          dueDate: lead.checkbackDate || new Date(Date.now() + 86400000).toISOString(),
          status: 'OPEN',
          priority: lead.riskScore > 60 ? 'URGENT' : 'HIGH',
          assignedTo: { firstName: 'Jeffrey', lastName: 'Mendoza' },
          leadId: lead.id,
          lead: { id: lead.id, firstName: lead.firstName, lastName: lead.lastName }
        };
        allTasks.unshift(newTask);
        if (!lead.tasks) lead.tasks = [];
        lead.tasks.unshift(newTask);
      }
    }
  }

  mockState.tasks = allTasks;
  return { leads, tasks: allTasks };
}


export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: (token: string) =>
    apiFetch('/api/auth/logout', { method: 'POST', token }),
  me: (token: string) =>
    apiFetch('/api/auth/me', { token }),

  // Dashboard
  getStats: (token: string) =>
    apiFetch('/api/dashboard/stats', { token }),
  getPipeline: (token: string) =>
    apiFetch('/api/dashboard/pipeline', { token }),
  getRecentActivity: (token: string) =>
    apiFetch('/api/dashboard/recent-activity', { token }),

  getLeads: async (token: string, params?: Record<string, string>, currentUser?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await apiFetch(`/api/leads${qs}`, { token }).catch(() => null);
    
    let remoteList: any[] = [];
    if (Array.isArray(res)) {
      remoteList = res;
    } else if (res && Array.isArray(res.leads)) {
      remoteList = res.leads;
    }

    // 1. Initialize map from local state (mockState.leads) which preserves user edits
    const map = new Map<string, any>();
    for (const localLead of mockState.leads) {
      map.set(localLead.id, localLead);
    }

    // 2. Fill in defaultLeads if not present in mockState yet
    for (const dl of defaultLeads) {
      if (!map.has(dl.id)) {
        map.set(dl.id, dl);
      }
    }

    // 3. Merge remote backend leads (e.g. live Jotform submissions like Dale Delosh)
    for (const rl of remoteList) {
      const rId = rl.leadId || rl.id || rl.jotformSubmissionId;
      if (!rId) continue;
      const existing = map.get(rId);
      if (existing) {
        map.set(rId, { ...existing, ...rl });
      } else {
        map.set(rId, {
          id: rId,
          jotformSubmissionId: rl.jotformSubmissionId || rId,
          firstName: rl.firstName || 'New',
          lastName: rl.lastName || 'Intake',
          name: rl.name || `${rl.firstName || 'New'} ${rl.lastName || 'Intake'}`,
          phone: rl.phoneNumber || rl.phone || '555-000-0000',
          email: rl.email || '',
          medicaidNumber: rl.medicaidNumber || '',
          stage: rl.stage || rl.status || 'NEW',
          status: rl.status || rl.stage || 'NEW',
          source: 'Jotform Intake',
          referralSource: 'Community Referral',
          serviceCoordinator: 'Unassigned',
          serviceType: 'NHTD & TBI',
          county: rl.county || 'KINGS',
          payerType: 'Medicaid (Fee-for-Service)',
          totalCallAttempts: 0,
          owner: { firstName: 'Jeffrey', lastName: 'Mendoza' },
          assignedTo: 'Jeffrey Mendoza',
          riskLevel: 'Normal',
          riskScore: 10,
          createdAt: rl.initialIntakeAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          checkbackDate: null,
          isCheckbackTooFar: false,
          isCheckbackOverdue: false,
          processInstances: [],
          updates: []
        });
      }
    }

    let finalLeads = Array.from(map.values());
    
    // Execute Intelligent Tasking & Risk Calculation Engine
    const intel = runIntelligentTaskingEngine(finalLeads);
    finalLeads = intel.leads;
    mockState.leads = finalLeads;
    saveLeadsToStorage();

    // Marketer Role Access Control (RBAC): Filter records by assigned referral sources
    const activeUser = currentUser || mockState.user;
    if (activeUser && (activeUser.role || '').toUpperCase() === 'MARKETER') {
      const allowedSources = Array.isArray(activeUser.assignedSources) ? activeUser.assignedSources : [];
      finalLeads = finalLeads.filter((l: any) => {
        const matchesSource = allowedSources.includes(l.referralSource) || allowedSources.includes(l.source) || allowedSources.includes(l.serviceCoordinator);
        const isAssigned = l.assignedTo === activeUser.name || l.assignedTo === `${activeUser.firstName} ${activeUser.lastName}`;
        const isCreator = l.createdBy?.email === activeUser.email;
        return matchesSource || isAssigned || isCreator;
      });
    }

    if (params?.status) {
      finalLeads = finalLeads.filter((l: any) => l.status === params.status || l.stage === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      finalLeads = finalLeads.filter((l: any) =>
        (l.firstName && l.firstName.toLowerCase().includes(q)) ||
        (l.lastName && l.lastName.toLowerCase().includes(q)) ||
        (l.name && l.name.toLowerCase().includes(q))
      );
    }

    return { leads: finalLeads, total: finalLeads.length };
  },

  getLead: async (token: string, id: string) => {
    const local = mockState.leads.find(l => l.id === id);
    const res = await apiFetch(`/api/leads/${id}`, { token }).catch(() => null);
    
    if (local) {
      // Merge remote response with local state, giving local user edits 100% precedence
      const merged = { ...(res && res.id ? res : {}), ...local };
      if (!merged.updates) merged.updates = local.updates || [];
      if (!merged.processInstances) merged.processInstances = local.processInstances || [];
      return merged;
    }

    if (res && res.id) {
      if (!res.updates) res.updates = [];
      if (!res.processInstances) res.processInstances = [];
      return res;
    }
    return null;
  },

  createLead: async (token: string, data: any) => {
    const res = await apiFetch('/api/leads', { method: 'POST', body: JSON.stringify(data), token }).catch(() => null);
    const nameParts = (data.name || `${data.firstName || 'New'} ${data.lastName || 'Intake'}`).split(' ');
    const newLead: LeadItem = {
      id: res?.id || `lead-${Date.now()}`,
      firstName: data.firstName || nameParts[0] || 'New',
      lastName: data.lastName || nameParts.slice(1).join(' ') || 'Intake',
      name: data.name || `${data.firstName || 'New'} ${data.lastName || 'Intake'}`,
      phone: data.phone || '555-000-0000',
      email: data.email || 'intake@example.com',
      stage: data.stage || data.status || 'NEW',
      status: data.status || data.stage || 'NEW',
      source: data.source || 'PHONE_INQUIRY',
      serviceType: data.serviceType || 'HHA/PCA',
      county: data.county || 'KINGS',
      payerType: data.payerType || 'MEDICAID',
      totalCallAttempts: 0,
      owner: { firstName: mockState.user.firstName, lastName: mockState.user.lastName },
      blockerType: data.blockerType || null,
      blockerNotes: data.blockerNotes || null,
      riskLevel: 'Normal',
      riskScore: 10,
      assignedTo: mockState.user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkbackDate: null,
      isCheckbackTooFar: false,
      isCheckbackOverdue: false,
      processInstances: [],
      updates: [
        {
          id: `upd-${Date.now()}`,
          type: 'INTAKE_CREATED',
          content: 'Lead profile created in Intake CRM.',
          createdAt: new Date().toISOString(),
          createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName }
        }
      ]
    };

    const existingIdx = mockState.leads.findIndex(l => l.id === newLead.id);
    if (existingIdx !== -1) {
      mockState.leads[existingIdx] = newLead;
    } else {
      mockState.leads.unshift(newLead);
    }
    saveLeadsToStorage();
    return newLead;
  },

  getDropdownLists: async (token: string): Promise<DropdownLists> => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('intake_crm_dropdowns');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...defaultDropdowns, ...parsed };
        }
      } catch {}
    }
    return defaultDropdowns;
  },

  updateDropdownLists: async (token: string, data: Partial<DropdownLists>) => {
    let current = await api.getDropdownLists(token);
    current = { ...current, ...data };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('intake_crm_dropdowns', JSON.stringify(current));
      } catch {}
    }
    return current;
  },

  updateDropdownList: async (token: string, category: keyof DropdownLists, items: string[]) => {
    return await api.updateDropdownLists(token, { [category]: items });
  },


  verifyPreAssessmentCoaching: async (token: string, leadId: string, customLingo?: string) => {
    const targetLead = mockState.leads.find(l => l.id === leadId);
    const lingoText = customLingo || DEFAULT_PRE_ASSESSMENT_COACHING_LINGO;
    
    if (targetLead) {
      targetLead.isCoachingVerified = true;
      targetLead.coachingVerifiedAt = new Date().toISOString();
      targetLead.coachingVerifiedBy = { firstName: mockState.user.firstName, lastName: mockState.user.lastName };
      targetLead.coachingLingo = lingoText;
      targetLead.updatedAt = new Date().toISOString();

      if (!targetLead.updates) targetLead.updates = [];
      targetLead.updates.unshift({
        id: `upd-coaching-${Date.now()}`,
        type: 'COACHING_VERIFIED',
        content: `✓ PRE-ASSESSMENT COACHING VERIFIED: ${lingoText}`,
        createdAt: new Date().toISOString(),
        createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName },
        leadId: leadId
      });

      saveLeadsToStorage();
    }

    apiFetch(`/api/leads/${leadId}/coaching`, { method: 'POST', body: JSON.stringify({ lingo: lingoText }), token }).catch(() => {});
    return targetLead;
  },

  updateLead: async (token: string, id: string, data: any, currentUser?: any) => {
    let idx = mockState.leads.findIndex(l => l.id === id);
    if (idx === -1) {
      const existing = defaultLeads.find(l => l.id === id);
      if (existing) {
        mockState.leads.push({ ...existing });
        idx = mockState.leads.length - 1;
      }
    }

    if (idx !== -1) {
      const userRole = ((currentUser || mockState.user)?.role || 'ADMIN').toUpperCase();
      const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(userRole);

      // Restrict assignedTo / owner rep change to Managers & Admins only
      if ((data.assignedTo !== undefined || data.owner !== undefined) && !isAdminOrManager) {
        delete data.assignedTo;
        delete data.owner;
      }

      mockState.leads[idx] = { 
        ...mockState.leads[idx], 
        ...data, 
        updatedAt: new Date().toISOString() 
      };

      if (data.status || data.lostReason || data.blockerType) {
        if (!mockState.leads[idx].updates) mockState.leads[idx].updates = [];
        const statusText = data.status ? `Status updated to ${data.status}` : '';
        const reasonText = data.lostReason ? ` (Reason: ${data.lostReason})` : '';
        const blockerText = data.blockerType ? ` (Blocker: ${data.blockerType})` : '';
        
        mockState.leads[idx].updates!.unshift({
          id: `upd-${Date.now()}`,
          type: 'STATUS_CHANGE',
          content: `${statusText}${reasonText}${blockerText}`.trim(),
          createdAt: new Date().toISOString(),
          createdBy: { firstName: (currentUser || mockState.user).firstName, lastName: (currentUser || mockState.user).lastName },
          leadId: id
        });
      }

      saveLeadsToStorage();
    }

    // Fire & forget remote fetch sync
    apiFetch(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }).catch(() => {});

    return mockState.leads[idx] || data;
  },

  addLeadActivity: (token: string, id: string, data: any) => {
    const targetLead = mockState.leads.find(l => l.id === id);
    const newAct: TimelineUpdate = {
      id: `act-${Date.now()}`,
      type: data.type || 'NOTE',
      content: data.content || data.notes || 'Activity recorded',
      createdAt: new Date().toISOString(),
      createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName },
      leadId: id
    };
    if (targetLead) {
      if (!targetLead.updates) targetLead.updates = [];
      targetLead.updates.unshift(newAct);
    }
    mockState.activity.unshift(newAct);
    saveLeadsToStorage();

    apiFetch(`/api/leads/${id}/activity`, { method: 'POST', body: JSON.stringify(data), token }).catch(() => {});
    return newAct;
  },

  // Updates / Timeline
  createUpdate: async (token: string, data: { leadId: string; content: string; type?: string }) => {
    const targetLead = mockState.leads.find(l => l.id === data.leadId);
    const newUpd: TimelineUpdate = {
      id: `upd-${Date.now()}`,
      type: data.type || 'MANUAL_COMMENT',
      content: data.content,
      createdAt: new Date().toISOString(),
      createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName },
      leadId: data.leadId
    };

    if (targetLead) {
      if (!targetLead.updates) targetLead.updates = [];
      targetLead.updates.unshift(newUpd);
      targetLead.updatedAt = new Date().toISOString();
      saveLeadsToStorage();
    }

    mockState.activity.unshift({
      id: newUpd.id,
      type: newUpd.type,
      content: newUpd.content,
      createdAt: newUpd.createdAt,
      createdBy: newUpd.createdBy,
      lead: targetLead ? { id: targetLead.id, firstName: targetLead.firstName, lastName: targetLead.lastName } : null
    });

    apiFetch('/api/updates', { method: 'POST', body: JSON.stringify(data), token }).catch(() => {});
    return newUpd;
  },

  getUpdates: (token: string, params: Record<string, string>) => {
    const urlObj = new URL('http://localhost/api/updates?' + new URLSearchParams(params).toString());
    const qLeadId = urlObj.searchParams.get('leadId');
    if (qLeadId) {
      const targetLead = mockState.leads.find(l => l.id === qLeadId);
      return targetLead?.updates || [];
    }
    return mockState.activity;
  },

  // RingCentral Hourly Sync Engine
  syncRingCentral: async (token: string) => {
    try {
      const calls = await ringCentralService.fetchRecentCalls();
      const smsList = await ringCentralService.fetchRecentSms();

      let syncedCalls = 0;
      let syncedSms = 0;
      let syncedTranscripts = 0;

      // Match calls to leads by phone number
      for (const call of calls) {
        const normFrom = normalizePhone(call.from.phoneNumber);
        const normTo = normalizePhone(call.to.phoneNumber);
        
        const matchedLead = mockState.leads.find(l => {
          const lPhone = normalizePhone(l.phone);
          return lPhone && (lPhone === normFrom || lPhone === normTo);
        });

        if (matchedLead) {
          if (!matchedLead.updates) matchedLead.updates = [];
          const updateId = `rc-call-${call.id}`;
          if (!matchedLead.updates.some(u => u.id === updateId)) {
            const aiText = call.aiTranscript 
              ? `\n🤖 AI Call Summary (${call.aiTranscript.sentiment}): ${call.aiTranscript.summary}\n📌 Action Items: ${call.aiTranscript.actionItems.join(', ')}\n📝 Full Transcript:\n${call.aiTranscript.transcriptText}`
              : '';
            
            matchedLead.updates.unshift({
              id: updateId,
              type: 'RINGCENTRAL_CALL',
              content: `📞 RingCentral ${call.direction} Call (${Math.round(call.duration / 60)} min) - ${call.result}${aiText}`,
              createdAt: call.startTime,
              createdBy: { firstName: 'RingCentral', lastName: 'AI Sync' },
              leadId: matchedLead.id
            });
            syncedCalls++;
            if (call.aiTranscript) syncedTranscripts++;
          }
        }
      }

      // Match SMS to leads by phone number
      for (const sms of smsList) {
        const normFrom = normalizePhone(sms.from.phoneNumber);
        const normTo = normalizePhone(sms.to.phoneNumber);

        const matchedLead = mockState.leads.find(l => {
          const lPhone = normalizePhone(l.phone);
          return lPhone && (lPhone === normFrom || lPhone === normTo);
        });

        if (matchedLead) {
          if (!matchedLead.updates) matchedLead.updates = [];
          const updateId = `rc-sms-${sms.id}`;
          if (!matchedLead.updates.some(u => u.id === updateId)) {
            matchedLead.updates.unshift({
              id: updateId,
              type: 'RINGCENTRAL_SMS',
              content: `💬 RingCentral ${sms.direction} SMS: "${sms.subject}"`,
              createdAt: sms.creationTime,
              createdBy: { firstName: 'RingCentral', lastName: 'SMS Gateway' },
              leadId: matchedLead.id
            });
            syncedSms++;
          }
        }
      }

      saveLeadsToStorage();
      return {
        syncedAt: new Date().toISOString(),
        callsCount: syncedCalls,
        smsCount: syncedSms,
        transcriptsCount: syncedTranscripts
      };
    } catch (err) {
      console.error('[RingCentral Sync Error]', err);
      return { syncedAt: new Date().toISOString(), callsCount: 0, smsCount: 0, transcriptsCount: 0 };
    }
  },

  // Processes & Templates
  getTemplates: async (token: string) => {
    const res = await apiFetch('/api/processes/templates', { token }).catch(() => null);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.templates)) return res.templates;
    return defaultTemplates;
  },

  startProcess: async (token: string, data: { leadId: string; processTemplateId: string; scheduledDate?: string }) => {
    const targetLead = mockState.leads.find(l => l.id === data.leadId) || mockState.leads[0];
    const template = defaultTemplates.find(t => t.id === data.processTemplateId) || defaultTemplates[0];

    const newInst = {
      id: `pi-${Date.now()}`,
      leadId: targetLead.id,
      processTemplateId: template.id,
      processTemplate: template,
      status: 'ACTIVE',
      stageInstances: template.stages.map((stg: any, idx: number) => ({
        id: `si-${Date.now()}-${idx}`,
        stageTemplateId: stg.id,
        stageTemplate: { ...stg, isFinalStage: idx === template.stages.length - 1 },
        status: idx === 0 ? 'ACTIVE' : 'PENDING',
        startedAt: idx === 0 ? new Date().toISOString() : null,
        dueAt: idx === 0 ? new Date(Date.now() + stg.dueDays * 86400000).toISOString() : null
      }))
    };

    if (!targetLead.processInstances) targetLead.processInstances = [];
    targetLead.processInstances.unshift(newInst);

    if (!targetLead.updates) targetLead.updates = [];
    targetLead.updates.unshift({
      id: `upd-${Date.now()}`,
      type: 'PROCESS_STARTED',
      content: `Started process workflow: "${template.name}"`,
      createdAt: new Date().toISOString(),
      createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName }
    });

    saveLeadsToStorage();
    apiFetch('/api/processes/start', { method: 'POST', body: JSON.stringify(data), token }).catch(() => {});
    return newInst;
  },

  advanceProcess: (token: string, instanceId: string, data?: { collectedDates?: Record<string, string> }) => {
    for (const lead of mockState.leads) {
      if (lead.processInstances) {
        const inst = lead.processInstances.find((pi: any) => pi.id === instanceId);
        if (inst) {
          const activeIdx = inst.stageInstances.findIndex((si: any) => si.status === 'ACTIVE');
          if (activeIdx !== -1) {
            inst.stageInstances[activeIdx].status = 'COMPLETED';
            inst.stageInstances[activeIdx].completedAt = new Date().toISOString();
            if (activeIdx + 1 < inst.stageInstances.length) {
              inst.stageInstances[activeIdx + 1].status = 'ACTIVE';
              inst.stageInstances[activeIdx + 1].startedAt = new Date().toISOString();
              const dueDays = inst.stageInstances[activeIdx + 1].stageTemplate.dueDays || 2;
              inst.stageInstances[activeIdx + 1].dueAt = new Date(Date.now() + dueDays * 86400000).toISOString();
            } else {
              inst.status = 'CLOSED';
              inst.outcome = 'WON';
            }
          }
          saveLeadsToStorage();
          return inst;
        }
      }
    }
    return apiFetch(`/api/processes/${instanceId}/advance`, { method: 'POST', body: JSON.stringify(data || {}), token });
  },

  closeProcess: (token: string, instanceId: string, data: { outcome: 'WON' | 'LOST'; lostReason?: string; collectedDates?: Record<string, string> }) => {
    for (const lead of mockState.leads) {
      if (lead.processInstances) {
        const inst = lead.processInstances.find((pi: any) => pi.id === instanceId);
        if (inst) {
          inst.status = 'CLOSED';
          inst.outcome = data.outcome || 'WON';
          inst.closedAt = new Date().toISOString();
          if (data.lostReason) inst.lostReason = data.lostReason;
          saveLeadsToStorage();
          return inst;
        }
      }
    }
    return apiFetch(`/api/processes/${instanceId}/close`, { method: 'POST', body: JSON.stringify(data), token });
  },

  // Tasks
  getTasks: (token: string, params?: Record<string, string>) => {
    return { tasks: mockState.tasks };
  },
  getTaskSummary: (token: string) => {
    return { total: mockState.tasks.length, open: mockState.tasks.filter(t => t.status === 'OPEN').length };
  },
  createTask: async (token: string, data: any) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: data.title || 'New Intake Task',
      dueAt: data.dueAt || new Date(Date.now() + 86400000).toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 86400000).toISOString(),
      status: 'OPEN',
      priority: data.priority || 'NORMAL',
      assignedTo: { firstName: mockState.user.firstName, lastName: mockState.user.lastName },
      lead: data.leadId ? { id: data.leadId, firstName: 'Lead', lastName: 'Patient' } : null
    };

    mockState.tasks.unshift(newTask);
    
    if (data.leadId) {
      const targetLead = mockState.leads.find(l => l.id === data.leadId);
      if (targetLead) {
        if (!targetLead.tasks) targetLead.tasks = [];
        targetLead.tasks.unshift(newTask);
        if (!targetLead.updates) targetLead.updates = [];
        targetLead.updates.unshift({
          id: `upd-${Date.now()}`,
          type: 'TASK_CREATED',
          content: `Created task: "${newTask.title}"`,
          createdAt: new Date().toISOString(),
          createdBy: { firstName: mockState.user.firstName, lastName: mockState.user.lastName }
        });
      }
    }

    saveLeadsToStorage();
    apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data), token }).catch(() => {});
    return newTask;
  },

  updateTask: (token: string, id: string, data: any) => {
    const idx = mockState.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      mockState.tasks[idx] = { ...mockState.tasks[idx], ...data };
      saveLeadsToStorage();
      return mockState.tasks[idx];
    }
    return apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data), token });
  },

  deleteTask: (token: string, id: string) => {
    mockState.tasks = mockState.tasks.filter(t => t.id !== id);
    saveLeadsToStorage();
    return { success: true };
  },

  // Users
  getUsers: async (token: string) => {
    const res = await apiFetch('/api/users', { token }).catch(() => null);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.users)) return res.users;
    return mockState.users;
  },
  createUser: (token: string, data: any) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      firstName: data.firstName || 'New',
      lastName: data.lastName || 'User',
      name: `${data.firstName || 'New'} ${data.lastName || 'User'}`,
      email: data.email || 'user@homecare4all.org',
      role: data.role || 'COORDINATOR',
      department: data.department || 'Intake',
      isActive: true
    };
    mockState.users.push(newUser);
    return newUser;
  },
  updateUser: (token: string, id: string, data: any) => {
    const idx = mockState.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      mockState.users[idx] = { ...mockState.users[idx], ...data };
      return mockState.users[idx];
    }
    return apiFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data), token });
  },

  // Performance
  getPerformance: (token: string) =>
    apiFetch('/api/performance', { token }),

  // Settings Configuration
  getSetting: (token: string, key: string) =>
    apiFetch(`/api/settings/${key}`, { token }),
  saveSetting: (token: string, key: string, value: any) =>
    apiFetch(`/api/settings/${key}`, { method: 'POST', body: JSON.stringify({ value }), token }),
};
