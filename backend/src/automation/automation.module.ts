import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { AutomationProcessor } from './automation.processor';
import { AutomationScheduler } from './automation.scheduler';
import { CommunicationsModule } from '../communications/communications.module';
import { TasksModule } from '../tasks/tasks.module';
import { UpdatesModule } from '../updates/updates.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'automation',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    }),
    CommunicationsModule,
    TasksModule,
    UpdatesModule,
  ],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationProcessor, AutomationScheduler],
  exports: [AutomationService],
})
export class AutomationModule {}
