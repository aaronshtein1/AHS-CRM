import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailProvider } from '../communications/providers/email.provider';
import { SmsProvider } from '../communications/providers/sms.provider';
import { TasksService } from '../tasks/tasks.service';
import { UpdatesService } from '../updates/updates.service';
import { JobStatus, TaskPriority, CommunicationType, CommunicationStatus, CommunicationDirection } from '@prisma/client';

interface AutomationJobData {
  jobId: string;
  ruleId: string;
  patientId: string;
  processInstanceId?: string;
  stageInstanceId?: string;
  userId?: string;
}

@Processor('automation')
export class AutomationProcessor {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SmsProvider,
    private readonly tasksService: TasksService,
    private readonly updatesService: UpdatesService,
  ) {}

  @Process('execute')
  async handleAutomation(job: Job<AutomationJobData>) {
    const { jobId, ruleId, patientId, processInstanceId, stageInstanceId, userId } = job.data;
    this.logger.log(`Processing automation job ${jobId}`);

    // Update job status
    await this.prisma.scheduledJob.update({
      where: { id: jobId },
      data: { status: JobStatus.PROCESSING, startedAt: new Date() },
    });

    try {
      // Get the rule
      const rule = await this.prisma.automationRule.findUnique({
        where: { id: ruleId },
      });

      if (!rule || !rule.isActive) {
        this.logger.log(`Rule ${ruleId} is inactive or not found, skipping`);
        await this.markJobCompleted(jobId);
        return;
      }

      // Get patient with contacts
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          contacts: true,
          owner: true,
        },
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Evaluate conditions
      const conditions = rule.conditions as any || {};
      if (!this.evaluateConditions(patient, conditions)) {
        this.logger.log(`Conditions not met for job ${jobId}, skipping actions`);
        await this.markJobCompleted(jobId);
        return;
      }

      // Execute actions
      const actions = rule.actions as any[];
      for (const action of actions) {
        await this.executeAction(action, {
          patient,
          processInstanceId,
          stageInstanceId,
          userId,
        });
      }

      await this.markJobCompleted(jobId);
    } catch (error: any) {
      this.logger.error(`Automation job ${jobId} failed: ${error.message}`);
      await this.prisma.scheduledJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          lastError: error.message,
          attempts: { increment: 1 },
        },
      });
      throw error;
    }
  }

  private evaluateConditions(patient: any, conditions: any): boolean {
    if (conditions.hasEmail) {
      const hasEmail = patient.contacts.some(
        (c: any) => c.type === 'EMAIL' && !c.doNotContact,
      );
      if (!hasEmail) return false;
    }

    if (conditions.hasPhone) {
      const hasPhone = patient.contacts.some(
        (c: any) => c.type === 'PHONE' && !c.doNotContact && c.canText,
      );
      if (!hasPhone) return false;
    }

    if (conditions.consentRequired) {
      const hasConsent = patient.contacts.some(
        (c: any) => c.canContact && !c.doNotContact,
      );
      if (!hasConsent) return false;
    }

    return true;
  }

  private async executeAction(
    action: { type: string; config: any },
    context: {
      patient: any;
      processInstanceId?: string;
      stageInstanceId?: string;
      userId?: string;
    },
  ) {
    const { patient, processInstanceId, stageInstanceId, userId } = context;

    switch (action.type) {
      case 'SEND_EMAIL': {
        const email = patient.contacts.find(
          (c: any) => c.type === 'EMAIL' && c.isPrimary && !c.doNotContact,
        ) || patient.contacts.find((c: any) => c.type === 'EMAIL' && !c.doNotContact);

        if (email) {
          const body = this.interpolateTemplate(action.config.body || '', patient);
          const subject = this.interpolateTemplate(action.config.subject || '', patient);

          // Create communication record
          const comm = await this.prisma.communication.create({
            data: {
              patientId: patient.id,
              processInstanceId,
              type: CommunicationType.EMAIL,
              direction: CommunicationDirection.OUTBOUND,
              status: CommunicationStatus.QUEUED,
              toAddress: email.value,
              fromAddress: process.env.EMAIL_FROM || 'noreply@patientcrm.com',
              subject,
              body,
            },
          });

          try {
            const result = await this.emailProvider.send({
              to: email.value,
              subject,
              body,
            });

            await this.prisma.communication.update({
              where: { id: comm.id },
              data: {
                status: CommunicationStatus.SENT,
                sentAt: new Date(),
                providerId: result.messageId,
              },
            });

            await this.updatesService.createSystemUpdate(
              patient.id,
              `Automated email sent to ${email.value}: ${subject}`,
              { automationType: 'email', to: email.value },
              { processInstanceId, communicationId: comm.id },
            );
          } catch (error: any) {
            await this.prisma.communication.update({
              where: { id: comm.id },
              data: {
                status: CommunicationStatus.FAILED,
                failedAt: new Date(),
                failureReason: error.message,
              },
            });
          }
        }
        break;
      }

      case 'SEND_SMS': {
        const phone = patient.contacts.find(
          (c: any) => c.type === 'PHONE' && c.isPrimary && !c.doNotContact && c.canText,
        ) || patient.contacts.find(
          (c: any) => c.type === 'PHONE' && !c.doNotContact && c.canText,
        );

        if (phone) {
          const body = this.interpolateTemplate(action.config.body || '', patient);

          const comm = await this.prisma.communication.create({
            data: {
              patientId: patient.id,
              processInstanceId,
              type: CommunicationType.SMS,
              direction: CommunicationDirection.OUTBOUND,
              status: CommunicationStatus.QUEUED,
              toAddress: phone.value,
              fromAddress: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
              body,
            },
          });

          try {
            const result = await this.smsProvider.send({
              to: phone.value,
              body,
            });

            await this.prisma.communication.update({
              where: { id: comm.id },
              data: {
                status: CommunicationStatus.SENT,
                sentAt: new Date(),
                providerId: result.messageId,
              },
            });

            await this.updatesService.createSystemUpdate(
              patient.id,
              `Automated SMS sent to ${phone.value}`,
              { automationType: 'sms', to: phone.value },
              { processInstanceId, communicationId: comm.id },
            );
          } catch (error: any) {
            await this.prisma.communication.update({
              where: { id: comm.id },
              data: {
                status: CommunicationStatus.FAILED,
                failedAt: new Date(),
                failureReason: error.message,
              },
            });
          }
        }
        break;
      }

      case 'CREATE_TASK': {
        await this.tasksService.create(
          {
            patientId: patient.id,
            processInstanceId,
            assignedToId: patient.ownerId,
            title: this.interpolateTemplate(action.config.title || 'Follow up required', patient),
            description: action.config.description,
            dueAt: action.config.dueDays
              ? new Date(Date.now() + action.config.dueDays * 24 * 60 * 60 * 1000)
              : undefined,
            priority: action.config.priority || TaskPriority.NORMAL,
          },
          userId || 'system',
        );
        break;
      }

      case 'ADD_UPDATE': {
        await this.updatesService.createSystemUpdate(
          patient.id,
          this.interpolateTemplate(action.config.content || 'Automated update', patient),
          { automationType: 'update' },
          { processInstanceId, stageInstanceId },
        );
        break;
      }

      case 'NOTIFY_REP': {
        // For now, create a task for the rep
        if (patient.ownerId) {
          await this.tasksService.create(
            {
              patientId: patient.id,
              processInstanceId,
              assignedToId: patient.ownerId,
              title: this.interpolateTemplate(
                action.config.message || 'Attention needed for {{firstName}} {{lastName}}',
                patient,
              ),
              priority: TaskPriority.HIGH,
            },
            userId || 'system',
          );

          await this.updatesService.createSystemUpdate(
            patient.id,
            `Rep notified: ${action.config.message || 'Attention needed'}`,
            { automationType: 'notification', repId: patient.ownerId },
            { processInstanceId },
          );
        }
        break;
      }
    }
  }

  private interpolateTemplate(template: string, patient: any): string {
    return template
      .replace(/\{\{firstName\}\}/g, patient.firstName || '')
      .replace(/\{\{lastName\}\}/g, patient.lastName || '')
      .replace(/\{\{fullName\}\}/g, `${patient.firstName || ''} ${patient.lastName || ''}`.trim())
      .replace(/\{\{patientId\}\}/g, patient.id || '');
  }

  private async markJobCompleted(jobId: string) {
    await this.prisma.scheduledJob.update({
      where: { id: jobId },
      data: { status: JobStatus.COMPLETED, completedAt: new Date() },
    });
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }
}
