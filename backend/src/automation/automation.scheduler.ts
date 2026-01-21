import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from './automation.service';
import { TriggerType, StageStatus } from '@prisma/client';

@Injectable()
export class AutomationScheduler implements OnModuleInit {
  private readonly logger = new Logger(AutomationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly automationService: AutomationService,
  ) {}

  onModuleInit() {
    this.logger.log('Automation scheduler initialized');
  }

  // Run every minute to check for overdue stages
  @Cron(CronExpression.EVERY_MINUTE)
  async checkOverdueStages() {
    this.logger.debug('Checking for overdue stages...');

    try {
      const overdueStages = await this.prisma.processStageInstance.findMany({
        where: {
          status: StageStatus.ACTIVE,
          dueAt: { lt: new Date() },
        },
        include: {
          processInstance: {
            include: {
              patient: true,
              processTemplate: true,
            },
          },
          stageTemplate: true,
        },
      });

      this.logger.debug(`Found ${overdueStages.length} overdue stages`);

      for (const stage of overdueStages) {
        // Check if we've already triggered overdue for this stage recently
        const recentJob = await this.prisma.scheduledJob.findFirst({
          where: {
            stageInstanceId: stage.id,
            automationRule: {
              triggerType: TriggerType.STAGE_OVERDUE,
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (recentJob) {
          continue; // Skip, already triggered
        }

        this.logger.log(
          `Triggering STAGE_OVERDUE for stage ${stage.stageTemplate.name} in process ${stage.processInstance.id}`,
        );

        await this.automationService.triggerRules(TriggerType.STAGE_OVERDUE, {
          patientId: stage.processInstance.patientId,
          processInstanceId: stage.processInstance.id,
          stageInstanceId: stage.id,
          stageTemplateId: stage.stageTemplateId,
          processTemplateId: stage.processInstance.processTemplateId,
        });
      }
    } catch (error: any) {
      this.logger.error(`Error checking overdue stages: ${error.message}`);
    }
  }

  // Run every hour to clean up old completed jobs
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldJobs() {
    this.logger.debug('Cleaning up old jobs...');

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await this.prisma.scheduledJob.deleteMany({
        where: {
          status: { in: ['COMPLETED', 'CANCELLED'] },
          completedAt: { lt: thirtyDaysAgo },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} old jobs`);
      }
    } catch (error: any) {
      this.logger.error(`Error cleaning up jobs: ${error.message}`);
    }
  }
}
