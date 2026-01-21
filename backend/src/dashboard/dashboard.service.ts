import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessStatus, StageStatus, TaskStatus, UserRole } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyPatients(userId: string, userRole: UserRole) {
    const where = userRole === UserRole.REP ? { ownerId: userId } : {};

    return this.prisma.patient.findMany({
      where: { ...where, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        processInstances: {
          where: { status: ProcessStatus.ACTIVE },
          include: {
            processTemplate: { select: { name: true } },
            stageInstances: {
              where: { status: StageStatus.ACTIVE },
              include: { stageTemplate: { select: { name: true } } },
            },
          },
        },
      },
    });
  }

  async getMyProcesses(userId: string, userRole: UserRole) {
    const where = userRole === UserRole.REP ? { assignedToId: userId } : {};

    return this.prisma.processInstance.findMany({
      where: { ...where, status: ProcessStatus.ACTIVE },
      orderBy: { dueAt: 'asc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        processTemplate: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        stageInstances: {
          where: { status: StageStatus.ACTIVE },
          include: { stageTemplate: { select: { name: true, order: true } } },
        },
      },
    });
  }

  async getDueToday(userId: string, userRole: UserRole) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      status: StageStatus.ACTIVE,
      dueAt: { gte: startOfDay, lte: endOfDay },
    };

    if (userRole === UserRole.REP) {
      where.processInstance = { assignedToId: userId };
    }

    return this.prisma.processStageInstance.findMany({
      where,
      include: {
        stageTemplate: { select: { name: true, order: true } },
        processInstance: {
          include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            processTemplate: { select: { name: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { dueAt: 'asc' },
    });
  }

  async getOverdue(userId: string, userRole: UserRole) {
    const where: any = {
      status: StageStatus.ACTIVE,
      dueAt: { lt: new Date() },
    };

    if (userRole === UserRole.REP) {
      where.processInstance = { assignedToId: userId };
    }

    return this.prisma.processStageInstance.findMany({
      where,
      include: {
        stageTemplate: { select: { name: true, order: true } },
        processInstance: {
          include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            processTemplate: { select: { name: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { dueAt: 'asc' },
    });
  }

  async getStats(userId: string, userRole: UserRole) {
    const userFilter = userRole === UserRole.REP ? { ownerId: userId } : {};
    const processFilter = userRole === UserRole.REP ? { assignedToId: userId } : {};

    const [
      totalPatients,
      activePatients,
      activeProcesses,
      overdueStages,
      pendingTasks,
      recentActivity,
    ] = await Promise.all([
      this.prisma.patient.count({ where: userFilter }),
      this.prisma.patient.count({
        where: { ...userFilter, status: 'ACTIVE' },
      }),
      this.prisma.processInstance.count({
        where: { ...processFilter, status: ProcessStatus.ACTIVE },
      }),
      this.prisma.processStageInstance.count({
        where: {
          status: StageStatus.ACTIVE,
          dueAt: { lt: new Date() },
          processInstance: processFilter,
        },
      }),
      this.prisma.task.count({
        where: {
          assignedToId: userRole === UserRole.REP ? userId : undefined,
          status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
        },
      }),
      this.prisma.update.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          patient: userFilter,
        },
      }),
    ]);

    return {
      totalPatients,
      activePatients,
      activeProcesses,
      overdueStages,
      pendingTasks,
      recentActivity,
    };
  }

  async getRecentActivity(userId: string, userRole: UserRole, limit = 20) {
    const where: any = {};
    if (userRole === UserRole.REP) {
      where.patient = { ownerId: userId };
    }

    return this.prisma.update.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        processInstance: {
          select: { processTemplate: { select: { name: true } } },
        },
      },
    });
  }
}
