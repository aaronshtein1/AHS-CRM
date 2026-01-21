import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

interface AuditLogInput {
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId?: string;
  previousData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          userId: input.userId,
          previousData: input.previousData ? JSON.parse(JSON.stringify(input.previousData)) : null,
          newData: input.newData ? JSON.parse(JSON.stringify(input.newData)) : null,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });

      this.logger.debug(
        `Audit: ${input.action} on ${input.entityType}:${input.entityId} by ${input.userId || 'system'}`,
      );
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw - audit logging should not break main operations
    }
  }

  async getEntityHistory(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async getUserActivity(userId: string, params?: { skip?: number; take?: number }) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      skip: params?.skip || 0,
      take: params?.take || 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecentActivity(params?: { skip?: number; take?: number }) {
    return this.prisma.auditLog.findMany({
      skip: params?.skip || 0,
      take: params?.take || 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }
}
