import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PatientsService } from '../patients/patients.service';
import { CreateProcessInstanceDto } from './dto/create-process-instance.dto';
import {
  ProcessStatus,
  ProcessOutcome,
  StageStatus,
  UpdateType,
  AuditAction,
  UserRole,
} from '@prisma/client';

@Injectable()
export class ProcessInstancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly patientsService: PatientsService,
  ) {}

  async create(patientId: string, createDto: CreateProcessInstanceDto, userId: string, userRole: UserRole) {
    // Verify patient access
    const patient = await this.patientsService.findOne(patientId, userId, userRole);

    // Get template with stages
    const template = await this.prisma.processTemplate.findUnique({
      where: { id: createDto.processTemplateId },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    if (!template) {
      throw new NotFoundException('Process template not found');
    }

    if (!template.isActive) {
      throw new BadRequestException('Process template is not active');
    }

    if (template.stages.length === 0) {
      throw new BadRequestException('Process template has no stages');
    }

    // Calculate due date
    const dueAt = template.defaultDueDays
      ? new Date(Date.now() + template.defaultDueDays * 24 * 60 * 60 * 1000)
      : null;

    // Create process instance with all stage instances
    const instance = await this.prisma.$transaction(async (tx) => {
      // Create the process instance
      const process = await tx.processInstance.create({
        data: {
          patientId,
          processTemplateId: template.id,
          assignedToId: createDto.assignedToId || patient.ownerId || userId,
          status: ProcessStatus.ACTIVE,
          dueAt,
          notes: createDto.notes,
          createdById: userId,
        },
      });

      // Create stage instances for all stages
      const stageInstances = await Promise.all(
        template.stages.map((stage, index) => {
          const isFirst = index === 0;
          const stageDueAt = stage.dueDays
            ? new Date(Date.now() + stage.dueDays * 24 * 60 * 60 * 1000)
            : null;

          return tx.processStageInstance.create({
            data: {
              processInstanceId: process.id,
              stageTemplateId: stage.id,
              status: isFirst ? StageStatus.ACTIVE : StageStatus.PENDING,
              enteredAt: isFirst ? new Date() : null,
              dueAt: isFirst ? stageDueAt : null,
            },
          });
        }),
      );

      // Update current stage
      const firstStage = stageInstances[0];
      await tx.processInstance.update({
        where: { id: process.id },
        data: { currentStageId: firstStage.id },
      });

      // Create initial transition record
      await tx.stageTransition.create({
        data: {
          processInstanceId: process.id,
          toStageId: firstStage.id,
          performedById: userId,
          reason: 'Process started',
        },
      });

      // Create system update
      await tx.update.create({
        data: {
          patientId,
          processInstanceId: process.id,
          stageInstanceId: firstStage.id,
          type: UpdateType.SYSTEM,
          content: `Process "${template.name}" started`,
          createdById: userId,
        },
      });

      return process;
    });

    // Audit log
    await this.auditService.log({
      entityType: 'ProcessInstance',
      entityId: instance.id,
      action: AuditAction.CREATE,
      userId,
      newData: instance,
    });

    return this.findOne(instance.id, userId, userRole);
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const instance = await this.prisma.processInstance.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, ownerId: true },
        },
        processTemplate: {
          select: { id: true, name: true, description: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        stageInstances: {
          include: {
            stageTemplate: true,
            completedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { stageTemplate: { order: 'asc' } },
        },
        reopenedFrom: {
          select: { id: true, startedAt: true, completedAt: true },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('Process instance not found');
    }

    // RBAC check
    if (userRole === UserRole.REP) {
      if (instance.patient.ownerId !== userId && instance.assignedToId !== userId) {
        throw new ForbiddenException('You do not have access to this process');
      }
    }

    return instance;
  }

  async findByPatient(patientId: string, userId: string, userRole: UserRole) {
    // Verify patient access
    await this.patientsService.findOne(patientId, userId, userRole);

    return this.prisma.processInstance.findMany({
      where: { patientId },
      include: {
        processTemplate: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        stageInstances: {
          where: { status: StageStatus.ACTIVE },
          include: {
            stageTemplate: { select: { name: true, order: true } },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async advanceStage(
    instanceId: string,
    stageId: string,
    data: { notes?: string; checklistStatus?: Record<string, boolean> },
    userId: string,
    userRole: UserRole,
  ) {
    const instance = await this.findOne(instanceId, userId, userRole);

    // Find current and target stage instances
    const currentStageInstance = instance.stageInstances.find(
      (s) => s.status === StageStatus.ACTIVE,
    );
    const targetStageInstance = instance.stageInstances.find(
      (s) => s.id === stageId,
    );

    if (!currentStageInstance) {
      throw new BadRequestException('No active stage found');
    }

    if (!targetStageInstance) {
      throw new NotFoundException('Target stage not found');
    }

    // Verify stage order (can only advance to next stages or allowed branches)
    const currentOrder = currentStageInstance.stageTemplate.order;
    const targetOrder = targetStageInstance.stageTemplate.order;
    const allowedNextStages = (currentStageInstance.stageTemplate.allowedNextStages as string[]) || [];

    if (targetOrder <= currentOrder && !allowedNextStages.includes(targetStageInstance.stageTemplateId)) {
      throw new BadRequestException('Invalid stage transition');
    }

    // Check if target is final stage
    const isFinal = targetStageInstance.stageTemplate.isFinalStage;
    const outcome = targetStageInstance.stageTemplate.outcomeType;

    const stageDueAt = targetStageInstance.stageTemplate.dueDays
      ? new Date(Date.now() + targetStageInstance.stageTemplate.dueDays * 24 * 60 * 60 * 1000)
      : null;

    // Update in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Complete current stage
      await tx.processStageInstance.update({
        where: { id: currentStageInstance.id },
        data: {
          status: StageStatus.COMPLETED,
          completedAt: new Date(),
          completedById: userId,
          notes: data.notes,
          checklistStatus: data.checklistStatus,
        },
      });

      // Activate target stage
      await tx.processStageInstance.update({
        where: { id: targetStageInstance.id },
        data: {
          status: StageStatus.ACTIVE,
          enteredAt: new Date(),
          dueAt: stageDueAt,
        },
      });

      // Update process instance
      const processUpdate: any = {
        currentStageId: targetStageInstance.id,
      };

      if (isFinal) {
        processUpdate.status = ProcessStatus.COMPLETED;
        processUpdate.completedAt = new Date();
        if (outcome && outcome !== 'NONE') {
          processUpdate.outcome = outcome as ProcessOutcome;
        }
      }

      const updated = await tx.processInstance.update({
        where: { id: instanceId },
        data: processUpdate,
      });

      // Create transition record
      await tx.stageTransition.create({
        data: {
          processInstanceId: instanceId,
          fromStageId: currentStageInstance.id,
          toStageId: targetStageInstance.id,
          performedById: userId,
          reason: data.notes,
        },
      });

      // Create update
      await tx.update.create({
        data: {
          patientId: instance.patientId,
          processInstanceId: instanceId,
          stageInstanceId: targetStageInstance.id,
          type: UpdateType.STAGE_CHANGE,
          content: `Stage advanced from "${currentStageInstance.stageTemplate.name}" to "${targetStageInstance.stageTemplate.name}"${isFinal ? ` - Process ${outcome === 'WON' ? 'Won' : outcome === 'LOST' ? 'Lost' : 'Completed'}` : ''}`,
          metadata: {
            fromStage: currentStageInstance.stageTemplate.name,
            toStage: targetStageInstance.stageTemplate.name,
            isFinal,
            outcome,
          },
          createdById: userId,
        },
      });

      return updated;
    });

    // Audit log
    await this.auditService.log({
      entityType: 'ProcessInstance',
      entityId: instanceId,
      action: AuditAction.STAGE_CHANGE,
      userId,
      previousData: { stageId: currentStageInstance.id },
      newData: { stageId: targetStageInstance.id },
    });

    return this.findOne(instanceId, userId, userRole);
  }

  async updateStageChecklist(
    instanceId: string,
    stageId: string,
    checklistStatus: Record<string, boolean>,
    userId: string,
    userRole: UserRole,
  ) {
    await this.findOne(instanceId, userId, userRole);

    return this.prisma.processStageInstance.update({
      where: { id: stageId },
      data: { checklistStatus },
    });
  }

  async cancel(instanceId: string, reason: string, userId: string, userRole: UserRole) {
    const instance = await this.findOne(instanceId, userId, userRole);

    if (instance.status !== ProcessStatus.ACTIVE) {
      throw new BadRequestException('Only active processes can be cancelled');
    }

    const updated = await this.prisma.processInstance.update({
      where: { id: instanceId },
      data: {
        status: ProcessStatus.CANCELLED,
        completedAt: new Date(),
        notes: reason,
      },
    });

    // Create update
    await this.prisma.update.create({
      data: {
        patientId: instance.patientId,
        processInstanceId: instanceId,
        type: UpdateType.SYSTEM,
        content: `Process cancelled: ${reason}`,
        createdById: userId,
      },
    });

    return updated;
  }

  async hold(instanceId: string, reason: string, userId: string, userRole: UserRole) {
    const instance = await this.findOne(instanceId, userId, userRole);

    if (instance.status !== ProcessStatus.ACTIVE) {
      throw new BadRequestException('Only active processes can be put on hold');
    }

    const updated = await this.prisma.processInstance.update({
      where: { id: instanceId },
      data: {
        status: ProcessStatus.ON_HOLD,
        notes: reason,
      },
    });

    await this.prisma.update.create({
      data: {
        patientId: instance.patientId,
        processInstanceId: instanceId,
        type: UpdateType.SYSTEM,
        content: `Process put on hold: ${reason}`,
        createdById: userId,
      },
    });

    return updated;
  }

  async resume(instanceId: string, userId: string, userRole: UserRole) {
    const instance = await this.findOne(instanceId, userId, userRole);

    if (instance.status !== ProcessStatus.ON_HOLD) {
      throw new BadRequestException('Only processes on hold can be resumed');
    }

    const updated = await this.prisma.processInstance.update({
      where: { id: instanceId },
      data: { status: ProcessStatus.ACTIVE },
    });

    await this.prisma.update.create({
      data: {
        patientId: instance.patientId,
        processInstanceId: instanceId,
        type: UpdateType.SYSTEM,
        content: 'Process resumed',
        createdById: userId,
      },
    });

    return updated;
  }

  async reopen(instanceId: string, userId: string, userRole: UserRole) {
    const instance = await this.findOne(instanceId, userId, userRole);

    if (instance.status !== ProcessStatus.COMPLETED && instance.status !== ProcessStatus.CANCELLED) {
      throw new BadRequestException('Only completed or cancelled processes can be reopened');
    }

    // Create a new instance linked to the old one
    const newInstance = await this.create(
      instance.patientId,
      {
        processTemplateId: instance.processTemplateId,
        assignedToId: instance.assignedToId || undefined,
        notes: `Reopened from process ${instance.id}`,
      },
      userId,
      userRole,
    );

    // Update the new instance with reopen info
    await this.prisma.processInstance.update({
      where: { id: newInstance.id },
      data: {
        reopenedFromId: instance.id,
        reopenCount: instance.reopenCount + 1,
      },
    });

    // Create update on original
    await this.prisma.update.create({
      data: {
        patientId: instance.patientId,
        processInstanceId: instanceId,
        type: UpdateType.SYSTEM,
        content: `Process reopened - new instance created`,
        metadata: { newInstanceId: newInstance.id },
        createdById: userId,
      },
    });

    return this.findOne(newInstance.id, userId, userRole);
  }

  async assignTo(instanceId: string, assignedToId: string, userId: string, userRole: UserRole) {
    const instance = await this.findOne(instanceId, userId, userRole);
    const previousAssignee = instance.assignedToId;

    const updated = await this.prisma.processInstance.update({
      where: { id: instanceId },
      data: { assignedToId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.update.create({
      data: {
        patientId: instance.patientId,
        processInstanceId: instanceId,
        type: UpdateType.ASSIGNMENT,
        content: `Process assigned to ${updated.assignedTo?.firstName} ${updated.assignedTo?.lastName}`,
        metadata: { previousAssignee, newAssignee: assignedToId },
        createdById: userId,
      },
    });

    await this.auditService.log({
      entityType: 'ProcessInstance',
      entityId: instanceId,
      action: AuditAction.ASSIGN,
      userId,
      previousData: { assignedToId: previousAssignee },
      newData: { assignedToId },
    });

    return updated;
  }
}
