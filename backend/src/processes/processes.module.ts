import { Module } from '@nestjs/common';
import { ProcessTemplatesService } from './process-templates.service';
import { ProcessInstancesService } from './process-instances.service';
import { ProcessTemplatesController } from './process-templates.controller';
import { ProcessInstancesController } from './process-instances.controller';
import { AuditModule } from '../audit/audit.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [AuditModule, PatientsModule],
  controllers: [ProcessTemplatesController, ProcessInstancesController],
  providers: [ProcessTemplatesService, ProcessInstancesService],
  exports: [ProcessTemplatesService, ProcessInstancesService],
})
export class ProcessesModule {}
