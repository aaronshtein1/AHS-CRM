import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PatientsService } from '../patients/patients.service';
import { UpdateType, UserRole } from '@prisma/client';

@Injectable()
export class UpdatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientsService: PatientsService,
  ) {}

  async findByPatient(
    patientId: string,
    userId: string,
    userRole: UserRole,
    params?: {
      type?: UpdateType;
      processInstanceId?: string;
      skip?: number;
      take?: number;
    },
  ) {
    // Verify access
    await this.patientsService.findOne(patientId, userId, userRole);

    const where: any = { patientId };
    if (params?.type) where.type = params.type;
    if (params?.processInstanceId) where.processInstanceId = params.processInstanceId;

    const [updates, total] = await Promise.all([
      this.prisma.update.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 50,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          processInstance: {
            select: {
              id: true,
              processTemplate: { select: { name: true } },
            },
          },
          stageInstance: {
            select: {
              id: true,
              stageTemplate: { select: { name: true } },
            },
          },
          communication: {
            select: {
              id: true,
              type: true,
              status: true,
              toAddress: true,
            },
          },
        },
      }),
      this.prisma.update.count({ where }),
    ]);

    return { updates, total };
  }

  async create(
    patientId: string,
    content: string,
    userId: string,
    userRole: UserRole,
    options?: {
      processInstanceId?: string;
      stageInstanceId?: string;
    },
  ) {
    // Verify access
    await this.patientsService.findOne(patientId, userId, userRole);

    return this.prisma.update.create({
      data: {
        patientId,
        type: UpdateType.MANUAL,
        content,
        processInstanceId: options?.processInstanceId,
        stageInstanceId: options?.stageInstanceId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async createSystemUpdate(
    patientId: string,
    content: string,
    metadata?: any,
    options?: {
      processInstanceId?: string;
      stageInstanceId?: string;
      communicationId?: string;
      createdById?: string;
    },
  ) {
    return this.prisma.update.create({
      data: {
        patientId,
        type: options?.communicationId ? UpdateType.COMMUNICATION : UpdateType.SYSTEM,
        content,
        metadata,
        processInstanceId: options?.processInstanceId,
        stageInstanceId: options?.stageInstanceId,
        communicationId: options?.communicationId,
        createdById: options?.createdById,
      },
    });
  }

  async redact(updateId: string, reason: string, userId: string, userRole: UserRole) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can redact updates');
    }

    const update = await this.prisma.update.findUnique({
      where: { id: updateId },
    });

    if (!update) {
      throw new NotFoundException('Update not found');
    }

    return this.prisma.update.update({
      where: { id: updateId },
      data: {
        isRedacted: true,
        redactedAt: new Date(),
        redactedById: userId,
        redactionReason: reason,
        content: '[REDACTED]',
      },
    });
  }
}
