import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatesService } from '../updates/updates.service';
import { PatientsService } from '../patients/patients.service';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { CommunicationType, CommunicationStatus, CommunicationDirection, UserRole } from '@prisma/client';

interface SendEmailDto {
  patientId: string;
  to: string;
  subject: string;
  body: string;
  processInstanceId?: string;
  scheduledFor?: Date;
}

interface SendSmsDto {
  patientId: string;
  to: string;
  body: string;
  processInstanceId?: string;
  scheduledFor?: Date;
}

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly updatesService: UpdatesService,
    private readonly patientsService: PatientsService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SmsProvider,
  ) {}

  async sendEmail(dto: SendEmailDto, userId: string, userRole: UserRole) {
    // Verify patient access
    const patient = await this.patientsService.findOne(dto.patientId, userId, userRole);

    // Check consent
    const contact = patient.contacts.find(
      (c) => c.type === 'EMAIL' && c.value === dto.to,
    );
    if (contact?.doNotContact) {
      throw new BadRequestException('Patient has opted out of contact');
    }

    // Create communication record
    const communication = await this.prisma.communication.create({
      data: {
        patientId: dto.patientId,
        processInstanceId: dto.processInstanceId,
        type: CommunicationType.EMAIL,
        direction: CommunicationDirection.OUTBOUND,
        status: dto.scheduledFor ? CommunicationStatus.PENDING : CommunicationStatus.QUEUED,
        toAddress: dto.to,
        fromAddress: process.env.EMAIL_FROM || 'noreply@patientcrm.com',
        subject: dto.subject,
        body: dto.body,
        scheduledFor: dto.scheduledFor,
        createdById: userId,
      },
    });

    // If not scheduled, send immediately
    if (!dto.scheduledFor) {
      try {
        const result = await this.emailProvider.send({
          to: dto.to,
          subject: dto.subject,
          body: dto.body,
        });

        await this.prisma.communication.update({
          where: { id: communication.id },
          data: {
            status: CommunicationStatus.SENT,
            sentAt: new Date(),
            providerId: result.messageId,
            providerResponse: result,
          },
        });

        // Create update
        await this.updatesService.createSystemUpdate(
          dto.patientId,
          `Email sent to ${dto.to}: ${dto.subject}`,
          { communicationType: 'EMAIL', to: dto.to },
          {
            processInstanceId: dto.processInstanceId,
            communicationId: communication.id,
            createdById: userId,
          },
        );
      } catch (error: any) {
        await this.prisma.communication.update({
          where: { id: communication.id },
          data: {
            status: CommunicationStatus.FAILED,
            failedAt: new Date(),
            failureReason: error.message,
          },
        });

        await this.updatesService.createSystemUpdate(
          dto.patientId,
          `Failed to send email to ${dto.to}: ${error.message}`,
          { communicationType: 'EMAIL', error: error.message },
          {
            processInstanceId: dto.processInstanceId,
            communicationId: communication.id,
            createdById: userId,
          },
        );
      }
    }

    return this.findOne(communication.id);
  }

  async sendSms(dto: SendSmsDto, userId: string, userRole: UserRole) {
    // Verify patient access
    const patient = await this.patientsService.findOne(dto.patientId, userId, userRole);

    // Check consent
    const contact = patient.contacts.find(
      (c) => c.type === 'PHONE' && c.value === dto.to,
    );
    if (contact?.doNotContact || contact?.canText === false) {
      throw new BadRequestException('Patient has opted out of text messages');
    }

    // Create communication record
    const communication = await this.prisma.communication.create({
      data: {
        patientId: dto.patientId,
        processInstanceId: dto.processInstanceId,
        type: CommunicationType.SMS,
        direction: CommunicationDirection.OUTBOUND,
        status: dto.scheduledFor ? CommunicationStatus.PENDING : CommunicationStatus.QUEUED,
        toAddress: dto.to,
        fromAddress: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        body: dto.body,
        scheduledFor: dto.scheduledFor,
        createdById: userId,
      },
    });

    // If not scheduled, send immediately
    if (!dto.scheduledFor) {
      try {
        const result = await this.smsProvider.send({
          to: dto.to,
          body: dto.body,
        });

        await this.prisma.communication.update({
          where: { id: communication.id },
          data: {
            status: CommunicationStatus.SENT,
            sentAt: new Date(),
            providerId: result.messageId,
            providerResponse: result,
          },
        });

        await this.updatesService.createSystemUpdate(
          dto.patientId,
          `SMS sent to ${dto.to}`,
          { communicationType: 'SMS', to: dto.to },
          {
            processInstanceId: dto.processInstanceId,
            communicationId: communication.id,
            createdById: userId,
          },
        );
      } catch (error: any) {
        await this.prisma.communication.update({
          where: { id: communication.id },
          data: {
            status: CommunicationStatus.FAILED,
            failedAt: new Date(),
            failureReason: error.message,
          },
        });

        await this.updatesService.createSystemUpdate(
          dto.patientId,
          `Failed to send SMS to ${dto.to}: ${error.message}`,
          { communicationType: 'SMS', error: error.message },
          {
            processInstanceId: dto.processInstanceId,
            communicationId: communication.id,
            createdById: userId,
          },
        );
      }
    }

    return this.findOne(communication.id);
  }

  async findByPatient(patientId: string, userId: string, userRole: UserRole) {
    await this.patientsService.findOne(patientId, userId, userRole);

    return this.prisma.communication.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const communication = await this.prisma.communication.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!communication) {
      throw new NotFoundException('Communication not found');
    }

    return communication;
  }

  async updateStatus(id: string, status: CommunicationStatus, providerData?: any) {
    return this.prisma.communication.update({
      where: { id },
      data: {
        status,
        deliveredAt: status === CommunicationStatus.DELIVERED ? new Date() : undefined,
        providerResponse: providerData,
      },
    });
  }
}
