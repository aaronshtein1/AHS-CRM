import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PatientsModule } from '../patients/patients.module';
import { UpdatesModule } from '../updates/updates.module';

@Module({
  imports: [PatientsModule, UpdatesModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
