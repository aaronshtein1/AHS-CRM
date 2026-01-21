import { Module } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { UpdatesModule } from '../updates/updates.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [UpdatesModule, PatientsModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService, EmailProvider, SmsProvider],
  exports: [CommunicationsService, EmailProvider, SmsProvider],
})
export class CommunicationsModule {}
