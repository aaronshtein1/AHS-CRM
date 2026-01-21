import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { TriggerType, JobStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface CreateAutomationRuleDto {
  processTemplateId: string;
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerStageId?: string;
  delayMinutes?: number;
  conditions?: {
    hasEmail?: boolean;
    hasPhone?: boolean;
    consentRequired?: boolean;
    quietHours?: { start: number; end: number };
  };
  actions: Array<{
    type: 'SEND_EMAIL' | 'SEND_SMS' | 'CREATE_TASK' | 'ADD_UPDATE' | 'NOTIFY_REP';
    config: Record<string, any>;
  }>;
  isActive?: boolean;
  order?: number;
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('automation') private readonly automationQueue: Queue,
  ) {}

  async createRule(dto: CreateAutomationRuleDto, userId: string) {
    return this.prisma.automationRule.create({
      data: {
        processTemplateId: dto.processTemplateId,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType,
        triggerStageId: dto.triggerStageId,
        delayMinutes: dto.delayMinutes || 0,
        conditions: dto.conditions || {},
        actions: dto.actions,
        isActive: dto.isActive ?? true,
        order: dto.order || 0,
      },
      include: {
        triggerStage: { select: { id: true, name: true } },
      },
    });
  }

  async findByTemplate(templateId: string) {
    return this.prisma.automationRule.findMany({
      where: { processTemplateId: templateId },
      include: {
        triggerStage: { select: { id: true, name: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async updateRule(id: string, dto: Partial<CreateAutomationRuleDto>) {
    const rule = await this.prisma.automationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Automation rule not found');

    return this.prisma.automationRule.update({
      where: { id },
      data: dto,
      include: {
        triggerStage: { select: { id: true, name: true } },
      },
    });
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.automationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Automation rule not found');

    return this.prisma.automationRule.delete({ where: { id } });
  }

  async triggerRules(
    trigger: TriggerType,
    context: {
      patientId: string;
      processInstanceId?: string;
      stageInstanceId?: string;
      stageTemplateId?: string;
      processTemplateId?: string;
      userId?: string;
    },
  ) {
    this.logger.log(`Triggering automation rules for ${trigger}`, context);

    // Find matching rules
    const where: any = {
      triggerType: trigger,
      isActive: true,
    };

    if (context.processTemplateId) {
      where.processTemplateId = context.processTemplateId;
    }

    if (trigger === TriggerType.STAGE_ENTERED && context.stageTemplateId) {
      where.triggerStageId = context.stageTemplateId;
    }

    const rules = await this.prisma.automationRule.findMany({
      where,
      include: {
        processTemplate: true,
      },
      orderBy: { order: 'asc' },
    });

    this.logger.log(`Found ${rules.length} matching automation rules`);

    // Queue jobs for each rule
    for (const rule of rules) {
      const idempotencyKey = `${rule.id}-${context.patientId}-${context.processInstanceId || 'none'}-${context.stageInstanceId || 'none'}-${Date.now()}`;

      // Check idempotency
      const existing = await this.prisma.scheduledJob.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        this.logger.log(`Skipping duplicate job: ${idempotencyKey}`);
        continue;
      }

      // Calculate scheduled time
      const scheduledFor = new Date(Date.now() + (rule.delayMinutes || 0) * 60 * 1000);

      // Check quiet hours
      if (rule.conditions && (rule.conditions as any).quietHours) {
        const quietHours = (rule.conditions as any).quietHours;
        const hour = scheduledFor.getHours();
        if (hour >= quietHours.start || hour < quietHours.end) {
          // Reschedule to after quiet hours
          scheduledFor.setHours(quietHours.end, 0, 0, 0);
          if (scheduledFor < new Date()) {
            scheduledFor.setDate(scheduledFor.getDate() + 1);
          }
        }
      }

      // Create scheduled job
      const job = await this.prisma.scheduledJob.create({
        data: {
          automationRuleId: rule.id,
          patientId: context.patientId,
          processInstanceId: context.processInstanceId,
          stageInstanceId: context.stageInstanceId,
          scheduledFor,
          idempotencyKey,
        },
      });

      // Add to Bull queue
      const delay = Math.max(0, scheduledFor.getTime() - Date.now());
      await this.automationQueue.add(
        'execute',
        {
          jobId: job.id,
          ruleId: rule.id,
          patientId: context.patientId,
          processInstanceId: context.processInstanceId,
          stageInstanceId: context.stageInstanceId,
          userId: context.userId,
        },
        {
          delay,
          jobId: job.id,
        },
      );

      this.logger.log(`Scheduled automation job ${job.id} for ${scheduledFor}`);
    }
  }

  async cancelJobsForStage(stageInstanceId: string) {
    // Cancel pending jobs for a stage (e.g., when stage is completed)
    const jobs = await this.prisma.scheduledJob.findMany({
      where: {
        stageInstanceId,
        status: JobStatus.PENDING,
      },
    });

    for (const job of jobs) {
      await this.prisma.scheduledJob.update({
        where: { id: job.id },
        data: { status: JobStatus.CANCELLED },
      });

      // Remove from Bull queue
      const bullJob = await this.automationQueue.getJob(job.id);
      if (bullJob) {
        await bullJob.remove();
      }
    }

    this.logger.log(`Cancelled ${jobs.length} jobs for stage ${stageInstanceId}`);
  }

  async getJobStatus(jobId: string) {
    const job = await this.prisma.scheduledJob.findUnique({
      where: { id: jobId },
      include: {
        automationRule: { select: { name: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async getPendingJobs(params?: { skip?: number; take?: number }) {
    return this.prisma.scheduledJob.findMany({
      where: { status: JobStatus.PENDING },
      skip: params?.skip || 0,
      take: params?.take || 50,
      orderBy: { scheduledFor: 'asc' },
      include: {
        automationRule: { select: { name: true, triggerType: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    });
  }
}
