import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProcessTemplateDto } from './dto/create-process-template.dto';
import { UpdateProcessTemplateDto } from './dto/update-process-template.dto';
import { CreateStageTemplateDto, UpdateStageTemplateDto } from './dto/stage-template.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class ProcessTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(createDto: CreateProcessTemplateDto, userId: string) {
    const template = await this.prisma.processTemplate.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        defaultDueDays: createDto.defaultDueDays,
        createdById: userId,
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      entityType: 'ProcessTemplate',
      entityId: template.id,
      action: AuditAction.CREATE,
      userId,
      newData: template,
    });

    return template;
  }

  async findAll(params?: { includeInactive?: boolean }) {
    const where = params?.includeInactive ? {} : { isActive: true };

    return this.prisma.processTemplate.findMany({
      where,
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: {
          select: { instances: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.processTemplate.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { order: 'asc' } },
        automationRules: {
          include: {
            triggerStage: { select: { id: true, name: true } },
          },
          orderBy: { order: 'asc' },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!template) {
      throw new NotFoundException('Process template not found');
    }

    return template;
  }

  async update(id: string, updateDto: UpdateProcessTemplateDto, userId: string) {
    const current = await this.findOne(id);

    const updated = await this.prisma.processTemplate.update({
      where: { id },
      data: updateDto,
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    await this.auditService.log({
      entityType: 'ProcessTemplate',
      entityId: id,
      action: AuditAction.UPDATE,
      userId,
      previousData: current,
      newData: updated,
    });

    return updated;
  }

  async deactivate(id: string, userId: string) {
    await this.findOne(id);

    return this.prisma.processTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Stage Template Management
  async addStage(templateId: string, createDto: CreateStageTemplateDto, userId: string) {
    await this.findOne(templateId);

    // Get max order
    const maxOrder = await this.prisma.processStageTemplate.aggregate({
      where: { processTemplateId: templateId },
      _max: { order: true },
    });

    const stage = await this.prisma.processStageTemplate.create({
      data: {
        processTemplateId: templateId,
        name: createDto.name,
        description: createDto.description,
        order: createDto.order ?? (maxOrder._max.order || 0) + 1,
        dueDays: createDto.dueDays,
        isFinalStage: createDto.isFinalStage,
        outcomeType: createDto.outcomeType,
        requiredFields: createDto.requiredFields || [],
        checklist: createDto.checklist || [],
        allowedNextStages: createDto.allowedNextStages || [],
      },
    });

    return stage;
  }

  async updateStage(templateId: string, stageId: string, updateDto: UpdateStageTemplateDto, userId: string) {
    const template = await this.findOne(templateId);
    const stage = template.stages.find(s => s.id === stageId);
    if (!stage) {
      throw new NotFoundException('Stage template not found');
    }

    return this.prisma.processStageTemplate.update({
      where: { id: stageId },
      data: updateDto,
    });
  }

  async deleteStage(templateId: string, stageId: string, userId: string) {
    const template = await this.findOne(templateId);
    const stage = template.stages.find(s => s.id === stageId);
    if (!stage) {
      throw new NotFoundException('Stage template not found');
    }

    // Check if stage is in use
    const usageCount = await this.prisma.processStageInstance.count({
      where: { stageTemplateId: stageId },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        'Cannot delete stage template that is in use by process instances',
      );
    }

    return this.prisma.processStageTemplate.delete({
      where: { id: stageId },
    });
  }

  async reorderStages(templateId: string, stageOrder: { id: string; order: number }[], userId: string) {
    await this.findOne(templateId);

    await this.prisma.$transaction(
      stageOrder.map(({ id, order }) =>
        this.prisma.processStageTemplate.update({
          where: { id },
          data: { order },
        }),
      ),
    );

    return this.findOne(templateId);
  }
}
