export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'REP';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  preferredLanguage: string;
  ssn?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DECEASED';
  ownerId?: string;
  owner?: User;
  createdById?: string;
  createdBy?: User;
  contacts?: PatientContact[];
  addresses?: Address[];
  emergencyContacts?: EmergencyContact[];
  insurancePolicies?: InsurancePolicy[];
  medicalInfo?: MedicalInfo;
  processInstances?: ProcessInstance[];
  createdAt: string;
  updatedAt: string;
}

export interface PatientContact {
  id: string;
  patientId: string;
  type: 'PHONE' | 'EMAIL';
  value: string;
  label: 'HOME' | 'WORK' | 'MOBILE' | 'OTHER';
  isPrimary: boolean;
  canContact: boolean;
  canText: boolean;
  doNotContact: boolean;
  verifiedAt?: string;
}

export interface Address {
  id: string;
  patientId: string;
  type: 'HOME' | 'MAILING' | 'TEMPORARY' | 'OTHER';
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  isPrimary: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface EmergencyContact {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  notes?: string;
}

export interface InsurancePolicy {
  id: string;
  patientId: string;
  type: 'MEDICAID' | 'MEDICARE' | 'COMMERCIAL' | 'OTHER';
  payerName: string;
  memberId?: string;
  groupNumber?: string;
  cin?: string;
  planName?: string;
  effectiveDate?: string;
  terminationDate?: string;
  isPrimary: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  notes?: string;
}

export interface MedicalInfo {
  id: string;
  patientId: string;
  pcpName?: string;
  pcpPhone?: string;
  pcpFax?: string;
  pcpAddress?: string;
  pcpNpi?: string;
  diagnoses?: Array<{ code: string; description?: string; date?: string }>;
  allergies?: string[];
  medications?: Array<{ name: string; dosage?: string; frequency?: string }>;
  notes?: string;
}

export interface ProcessTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  defaultDueDays?: number;
  stages: ProcessStageTemplate[];
  automationRules?: AutomationRule[];
}

export interface ProcessStageTemplate {
  id: string;
  processTemplateId: string;
  name: string;
  description?: string;
  order: number;
  dueDays?: number;
  isFinalStage: boolean;
  outcomeType: 'WON' | 'LOST' | 'NONE';
  requiredFields?: string[];
  checklist?: Array<{ item: string; required: boolean }>;
  allowedNextStages?: string[];
}

export interface ProcessInstance {
  id: string;
  patientId: string;
  patient?: Patient;
  processTemplateId: string;
  processTemplate?: ProcessTemplate;
  assignedToId?: string;
  assignedTo?: User;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
  outcome?: 'WON' | 'LOST';
  currentStageId?: string;
  startedAt: string;
  dueAt?: string;
  completedAt?: string;
  reopenedFromId?: string;
  reopenCount: number;
  notes?: string;
  stageInstances?: ProcessStageInstance[];
}

export interface ProcessStageInstance {
  id: string;
  processInstanceId: string;
  stageTemplateId: string;
  stageTemplate?: ProcessStageTemplate;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED';
  enteredAt?: string;
  dueAt?: string;
  completedAt?: string;
  completedById?: string;
  completedBy?: User;
  checklistStatus?: Record<string, boolean>;
  notes?: string;
}

export interface Update {
  id: string;
  patientId: string;
  processInstanceId?: string;
  processInstance?: ProcessInstance;
  stageInstanceId?: string;
  stageInstance?: ProcessStageInstance;
  communicationId?: string;
  type: 'MANUAL' | 'SYSTEM' | 'COMMUNICATION' | 'ASSIGNMENT' | 'STAGE_CHANGE';
  content: string;
  metadata?: Record<string, any>;
  createdById?: string;
  createdBy?: User;
  isRedacted: boolean;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  processTemplateId: string;
  name: string;
  description?: string;
  triggerType: 'STAGE_ENTERED' | 'STAGE_OVERDUE' | 'PROCESS_CREATED' | 'PATIENT_ASSIGNED' | 'MANUAL';
  triggerStageId?: string;
  triggerStage?: ProcessStageTemplate;
  delayMinutes: number;
  conditions?: Record<string, any>;
  actions: Array<{ type: string; config: Record<string, any> }>;
  isActive: boolean;
  order: number;
}

export interface Task {
  id: string;
  patientId: string;
  patient?: Patient;
  processInstanceId?: string;
  assignedToId?: string;
  assignedTo?: User;
  title: string;
  description?: string;
  dueAt?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedAt?: string;
  completedById?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  activeProcesses: number;
  overdueStages: number;
  pendingTasks: number;
  recentActivity: number;
}
