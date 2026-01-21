import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatesService } from '../updates/updates.service';
import { TaskStatus, TaskPriority, UserRole } from '@prisma/client';

interface CreateTaskDto {
  patientId: string;
  processInstanceId?: string;
  assignedToId?: string;
  title: string;
  description?: string;
  dueAt?: Date;
  priority?: TaskPriority;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly updatesService: UpdatesService,
  ) {}

  async create(dto: CreateTaskDto, userId: string) {
    const task = await this.prisma.task.create({
      data: {
        patientId: dto.patientId,
        processInstanceId: dto.processInstanceId,
        assignedToId: dto.assignedToId || userId,
        title: dto.title,
        description: dto.description,
        dueAt: dto.dueAt,
        priority: dto.priority || TaskPriority.NORMAL,
        createdById: userId,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.updatesService.createSystemUpdate(
      dto.patientId,
      `Task created: ${dto.title}`,
      { taskId: task.id },
      { processInstanceId: dto.processInstanceId, createdById: userId },
    );

    return task;
  }

  async findAll(
    userId: string,
    userRole: UserRole,
    params?: {
      status?: TaskStatus;
      assignedToId?: string;
      patientId?: string;
      dueToday?: boolean;
      overdue?: boolean;
      skip?: number;
      take?: number;
    },
  ) {
    const where: any = {};

    // RBAC: REPs can only see their tasks
    if (userRole === UserRole.REP) {
      where.assignedToId = userId;
    } else if (params?.assignedToId) {
      where.assignedToId = params.assignedToId;
    }

    if (params?.status) where.status = params.status;
    if (params?.patientId) where.patientId = params.patientId;

    if (params?.dueToday) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      where.dueAt = { gte: startOfDay, lte: endOfDay };
      where.status = { not: TaskStatus.COMPLETED };
    }

    if (params?.overdue) {
      where.dueAt = { lt: new Date() };
      where.status = { not: TaskStatus.COMPLETED };
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 50,
        orderBy: [{ dueAt: 'asc' }, { priority: 'desc' }],
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          processInstance: {
            select: {
              id: true,
              processTemplate: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, ownerId: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        completedBy: { select: { id: true, firstName: true, lastName: true } },
        processInstance: {
          select: {
            id: true,
            processTemplate: { select: { name: true } },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // RBAC check
    if (userRole === UserRole.REP && task.assignedToId !== userId && task.patient.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      dueAt?: Date;
      priority?: TaskPriority;
      status?: TaskStatus;
      assignedToId?: string;
    },
    userId: string,
    userRole: UserRole,
  ) {
    const task = await this.findOne(id, userId, userRole);

    return this.prisma.task.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async complete(id: string, userId: string, userRole: UserRole) {
    const task = await this.findOne(id, userId, userRole);

    const completed = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        completedById: userId,
      },
    });

    await this.updatesService.createSystemUpdate(
      task.patientId,
      `Task completed: ${task.title}`,
      { taskId: task.id },
      { processInstanceId: task.processInstanceId || undefined, createdById: userId },
    );

    return completed;
  }

  async cancel(id: string, userId: string, userRole: UserRole) {
    await this.findOne(id, userId, userRole);

    return this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.CANCELLED },
    });
  }
}
