import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { ContactsController } from './contacts.controller';
import { AddressesController } from './addresses.controller';
import { EmergencyContactsController } from './emergency-contacts.controller';
import { InsuranceController } from './insurance.controller';
import { MedicalInfoController } from './medical-info.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [
    PatientsController,
    ContactsController,
    AddressesController,
    EmergencyContactsController,
    InsuranceController,
    MedicalInfoController,
  ],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
