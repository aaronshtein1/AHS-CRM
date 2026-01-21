import { PrismaClient, UserRole, Gender, PatientStatus, ContactType, ContactLabel, AddressType, InsuranceType, OutcomeType, TriggerType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const repPassword = await bcrypt.hash('rep123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@patientcrm.com' },
    update: {},
    create: {
      email: 'admin@patientcrm.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const rep = await prisma.user.upsert({
    where: { email: 'rep@patientcrm.com' },
    update: {},
    create: {
      email: 'rep@patientcrm.com',
      passwordHash: repPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: UserRole.REP,
      isActive: true,
    },
  });

  console.log('Created users:', { admin: admin.email, rep: rep.email });

  // Create Process Template: Medicaid Eligibility + Intake
  const processTemplate = await prisma.processTemplate.upsert({
    where: { id: 'medicaid-intake-template' },
    update: {},
    create: {
      id: 'medicaid-intake-template',
      name: 'Medicaid Eligibility + Intake',
      description: 'Process for new patient intake and Medicaid eligibility verification',
      isActive: true,
      defaultDueDays: 30,
      createdById: admin.id,
    },
  });

  // Create Stage Templates
  const stages = [
    {
      id: 'stage-new-lead',
      name: 'New Lead',
      description: 'Initial lead entry and assessment',
      order: 1,
      dueDays: 1,
      isFinalStage: false,
      outcomeType: OutcomeType.NONE,
      checklist: [
        { item: 'Verify contact info', required: true },
        { item: 'Initial assessment', required: true },
      ],
    },
    {
      id: 'stage-contact-1',
      name: 'Contact Attempt 1',
      description: 'First contact attempt with patient',
      order: 2,
      dueDays: 2,
      isFinalStage: false,
      outcomeType: OutcomeType.NONE,
      checklist: [
        { item: 'Call made', required: true },
        { item: 'Voicemail left if no answer', required: false },
      ],
    },
    {
      id: 'stage-eligibility',
      name: 'Eligibility Verification',
      description: 'Verify Medicaid eligibility and coverage',
      order: 3,
      dueDays: 5,
      isFinalStage: false,
      outcomeType: OutcomeType.NONE,
      requiredFields: ['medicaidId'],
      checklist: [
        { item: 'Medicaid ID verified', required: true },
        { item: 'Coverage dates confirmed', required: true },
      ],
    },
    {
      id: 'stage-pcp-orders',
      name: 'PCP/Orders Needed',
      description: 'Obtain PCP information and necessary orders',
      order: 4,
      dueDays: 7,
      isFinalStage: false,
      outcomeType: OutcomeType.NONE,
      checklist: [
        { item: 'PCP identified', required: true },
        { item: 'Orders requested', required: true },
      ],
    },
    {
      id: 'stage-ready-schedule',
      name: 'Ready to Schedule SOC',
      description: 'Ready to schedule start of care',
      order: 5,
      dueDays: 3,
      isFinalStage: false,
      outcomeType: OutcomeType.NONE,
      checklist: [
        { item: 'All documents received', required: true },
        { item: 'Schedule confirmed', required: true },
      ],
    },
    {
      id: 'stage-closed-won',
      name: 'Closed/Won',
      description: 'Patient successfully onboarded',
      order: 6,
      dueDays: null,
      isFinalStage: true,
      outcomeType: OutcomeType.WON,
      checklist: [],
    },
    {
      id: 'stage-closed-lost',
      name: 'Closed/Lost',
      description: 'Patient did not proceed',
      order: 7,
      dueDays: null,
      isFinalStage: true,
      outcomeType: OutcomeType.LOST,
      checklist: [],
    },
  ];

  for (const stage of stages) {
    await prisma.processStageTemplate.upsert({
      where: { id: stage.id },
      update: {},
      create: {
        id: stage.id,
        processTemplateId: processTemplate.id,
        name: stage.name,
        description: stage.description,
        order: stage.order,
        dueDays: stage.dueDays,
        isFinalStage: stage.isFinalStage,
        outcomeType: stage.outcomeType,
        requiredFields: stage.requiredFields || [],
        checklist: stage.checklist,
        allowedNextStages: [],
      },
    });
  }

  console.log('Created process template with stages');

  // Create Automation Rules
  const automationRules = [
    {
      id: 'rule-contact1-sms',
      name: 'Contact Attempt 1 - Send SMS',
      description: 'Send SMS when entering Contact Attempt 1 stage',
      triggerType: TriggerType.STAGE_ENTERED,
      triggerStageId: 'stage-contact-1',
      delayMinutes: 0,
      conditions: { hasPhone: true },
      actions: [
        {
          type: 'SEND_SMS',
          config: {
            body: 'Hi {{firstName}}, this is Patient CRM reaching out about your healthcare needs. Please call us back at your earliest convenience.',
          },
        },
      ],
    },
    {
      id: 'rule-contact1-email',
      name: 'Contact Attempt 1 - Send Email',
      description: 'Send email when entering Contact Attempt 1 stage',
      triggerType: TriggerType.STAGE_ENTERED,
      triggerStageId: 'stage-contact-1',
      delayMinutes: 0,
      conditions: { hasEmail: true },
      actions: [
        {
          type: 'SEND_EMAIL',
          config: {
            subject: 'Important: Regarding Your Healthcare Application',
            body: 'Dear {{firstName}},\n\nWe are reaching out regarding your healthcare application. Please contact us at your earliest convenience to discuss next steps.\n\nBest regards,\nPatient CRM Team',
          },
        },
      ],
    },
    {
      id: 'rule-contact1-overdue',
      name: 'Contact Attempt 1 - Overdue Follow-up',
      description: 'Notify rep and send follow-up when Contact Attempt 1 is overdue',
      triggerType: TriggerType.STAGE_OVERDUE,
      triggerStageId: 'stage-contact-1',
      delayMinutes: 0,
      conditions: {},
      actions: [
        {
          type: 'NOTIFY_REP',
          config: {
            message: 'Contact Attempt 1 is overdue for {{firstName}} {{lastName}}',
          },
        },
        {
          type: 'SEND_SMS',
          config: {
            body: 'Hi {{firstName}}, we tried to reach you earlier. Please call us back when you have a moment.',
          },
        },
      ],
    },
  ];

  for (const rule of automationRules) {
    await prisma.automationRule.upsert({
      where: { id: rule.id },
      update: {},
      create: {
        id: rule.id,
        processTemplateId: processTemplate.id,
        name: rule.name,
        description: rule.description,
        triggerType: rule.triggerType,
        triggerStageId: rule.triggerStageId,
        delayMinutes: rule.delayMinutes,
        conditions: rule.conditions,
        actions: rule.actions,
        isActive: true,
        order: 0,
      },
    });
  }

  console.log('Created automation rules');

  // Create sample patients
  const patients = [
    {
      id: 'patient-john-doe',
      firstName: 'John',
      middleName: 'Michael',
      lastName: 'Doe',
      dateOfBirth: new Date('1985-06-15'),
      gender: Gender.MALE,
      preferredLanguage: 'en',
      status: PatientStatus.ACTIVE,
      notes: 'Initial contact via website form',
    },
    {
      id: 'patient-maria-garcia',
      firstName: 'Maria',
      lastName: 'Garcia',
      dateOfBirth: new Date('1972-03-22'),
      gender: Gender.FEMALE,
      preferredLanguage: 'es',
      status: PatientStatus.ACTIVE,
      notes: 'Referred by community outreach program',
    },
    {
      id: 'patient-robert-smith',
      firstName: 'Robert',
      lastName: 'Smith',
      dateOfBirth: new Date('1958-11-08'),
      gender: Gender.MALE,
      preferredLanguage: 'en',
      status: PatientStatus.ACTIVE,
      notes: 'Medicare/Medicaid dual eligible',
    },
  ];

  for (const patientData of patients) {
    const patient = await prisma.patient.upsert({
      where: { id: patientData.id },
      update: {},
      create: {
        ...patientData,
        ownerId: rep.id,
        createdById: admin.id,
      },
    });

    // Add contacts
    if (patient.id === 'patient-john-doe') {
      await prisma.patientContact.upsert({
        where: { id: 'contact-john-phone' },
        update: {},
        create: {
          id: 'contact-john-phone',
          patientId: patient.id,
          type: ContactType.PHONE,
          value: '+15551234567',
          label: ContactLabel.MOBILE,
          isPrimary: true,
          canContact: true,
          canText: true,
        },
      });
      await prisma.patientContact.upsert({
        where: { id: 'contact-john-email' },
        update: {},
        create: {
          id: 'contact-john-email',
          patientId: patient.id,
          type: ContactType.EMAIL,
          value: 'john.doe@example.com',
          label: ContactLabel.HOME,
          isPrimary: true,
          canContact: true,
        },
      });

      // Add address
      await prisma.address.upsert({
        where: { id: 'address-john' },
        update: {},
        create: {
          id: 'address-john',
          patientId: patient.id,
          type: AddressType.HOME,
          street1: '123 Main Street',
          street2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          county: 'New York',
          isPrimary: true,
        },
      });

      // Add emergency contact
      await prisma.emergencyContact.upsert({
        where: { id: 'ec-john' },
        update: {},
        create: {
          id: 'ec-john',
          patientId: patient.id,
          firstName: 'Jane',
          lastName: 'Doe',
          relationship: 'Spouse',
          phone: '+15559876543',
          email: 'jane.doe@example.com',
          isPrimary: true,
        },
      });

      // Add insurance
      await prisma.insurancePolicy.upsert({
        where: { id: 'insurance-john' },
        update: {},
        create: {
          id: 'insurance-john',
          patientId: patient.id,
          type: InsuranceType.MEDICAID,
          payerName: 'New York Medicaid',
          memberId: 'AB123456789',
          cin: 'CIN987654',
          planName: 'Managed Long Term Care',
          effectiveDate: new Date('2024-01-01'),
          isPrimary: true,
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedById: admin.id,
        },
      });

      // Add medical info
      await prisma.medicalInfo.upsert({
        where: { patientId: patient.id },
        update: {},
        create: {
          patientId: patient.id,
          pcpName: 'Dr. Emily Wilson',
          pcpPhone: '+15551112222',
          pcpNpi: '1234567890',
          diagnoses: [
            { code: 'E11.9', description: 'Type 2 diabetes mellitus', date: '2023-06-15' },
            { code: 'I10', description: 'Essential hypertension', date: '2022-03-20' },
          ],
          allergies: ['Penicillin', 'Sulfa drugs'],
          medications: [
            { name: 'Metformin', dosage: '500mg', frequency: 'twice daily' },
            { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily' },
          ],
          notes: 'Patient requires regular blood sugar monitoring',
        },
      });
    }

    if (patient.id === 'patient-maria-garcia') {
      await prisma.patientContact.upsert({
        where: { id: 'contact-maria-phone' },
        update: {},
        create: {
          id: 'contact-maria-phone',
          patientId: patient.id,
          type: ContactType.PHONE,
          value: '+15552223333',
          label: ContactLabel.MOBILE,
          isPrimary: true,
          canContact: true,
          canText: true,
        },
      });
    }

    if (patient.id === 'patient-robert-smith') {
      await prisma.patientContact.upsert({
        where: { id: 'contact-robert-phone' },
        update: {},
        create: {
          id: 'contact-robert-phone',
          patientId: patient.id,
          type: ContactType.PHONE,
          value: '+15553334444',
          label: ContactLabel.HOME,
          isPrimary: true,
          canContact: true,
          canText: false,
        },
      });
    }
  }

  console.log('Created sample patients with related data');

  // Create message templates
  const messageTemplates = [
    {
      id: 'template-welcome-sms',
      name: 'Welcome SMS',
      type: 'SMS' as const,
      body: 'Welcome to Patient CRM, {{firstName}}! We are here to help with your healthcare needs. Reply STOP to opt out.',
      isActive: true,
    },
    {
      id: 'template-welcome-email',
      name: 'Welcome Email',
      type: 'EMAIL' as const,
      subject: 'Welcome to Patient CRM',
      body: 'Dear {{firstName}},\n\nWelcome to Patient CRM. We are committed to helping you navigate your healthcare journey.\n\nPlease keep this email for your records.\n\nBest regards,\nPatient CRM Team',
      isActive: true,
    },
    {
      id: 'template-appointment-reminder',
      name: 'Appointment Reminder',
      type: 'SMS' as const,
      body: 'Hi {{firstName}}, this is a reminder about your upcoming appointment. Please call us if you need to reschedule.',
      isActive: true,
    },
  ];

  for (const template of messageTemplates) {
    await prisma.messageTemplate.upsert({
      where: { id: template.id },
      update: {},
      create: template,
    });
  }

  console.log('Created message templates');

  console.log('Seeding complete!');
  console.log('\n--- Login Credentials ---');
  console.log('Admin: admin@patientcrm.com / admin123');
  console.log('Rep: rep@patientcrm.com / rep123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
