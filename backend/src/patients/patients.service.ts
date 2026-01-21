import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Prisma, UserRole, UpdateType, AuditAction } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(createPatientDto: CreatePatientDto, userId: string) {
    const patient = await this.prisma.patient.create({
      data: {
        ...createPatientDto,
        createdById: userId,
        ownerId: createPatientDto.ownerId || userId,
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Create system update
    await this.prisma.update.create({
      data: {
        patientId: patient.id,
        type: UpdateType.SYSTEM,
        content: 'Patient record created',
        createdById: userId,
      },
    });

    // Audit log
    await this.auditService.log({
      entityType: 'Patient',
      entityId: patient.id,
      action: AuditAction.CREATE,
      userId,
      newData: patient,
    });

    return patient;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    ownerId?: string;
    status?: string;
    hasActiveProcess?: boolean;
    userId: string;
    userRole: UserRole;
  }) {
    const { skip = 0, take = 20, search, ownerId, status, hasActiveProcess, userId, userRole } = params;

    const where: Prisma.PatientWhereInput = {};

    // RBAC: REPs can only see their assigned patients
    if (userRole === UserRole.REP) {
      where.ownerId = userId;
    } else if (ownerId) {
      where.ownerId = ownerId;
    }

    if (status) {
      where.status = status as any;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { contacts: { some: { value: { contains: search } } } },
        { insurancePolicies: { some: { memberId: { contains: search } } } },
      ];
    }

    if (hasActiveProcess !== undefined) {
      if (hasActiveProcess) {
        where.processInstances = { some: { status: 'ACTIVE' } };
      } else {
        where.processInstances = { none: { status: 'ACTIVE' } };
      }
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        skip,
        take,
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
          processInstances: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              status: true,
              processTemplate: { select: { name: true } },
            },
          },
          _count: {
            select: {
              updates: true,
              processInstances: true,
            },
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { patients, total, skip, take };
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        contacts: { orderBy: { isPrimary: 'desc' } },
        addresses: { orderBy: { isPrimary: 'desc' } },
        emergencyContacts: { orderBy: { isPrimary: 'desc' } },
        insurancePolicies: { orderBy: { isPrimary: 'desc' } },
        medicalInfo: true,
        processInstances: {
          include: {
            processTemplate: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            stageInstances: {
              include: {
                stageTemplate: { select: { name: true, order: true } },
              },
              orderBy: { stageTemplate: { order: 'asc' } },
            },
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // RBAC check
    if (userRole === UserRole.REP && patient.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this patient');
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto, userId: string, userRole: UserRole) {
    // Get current patient for audit
    const currentPatient = await this.findOne(id, userId, userRole);

    const updated = await this.prisma.patient.update({
      where: { id },
      data: updatePatientDto,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Audit log
    await this.auditService.log({
      entityType: 'Patient',
      entityId: id,
      action: AuditAction.UPDATE,
      userId,
      previousData: currentPatient,
      newData: updated,
    });

    return updated;
  }

  async assignOwner(id: string, newOwnerId: string, userId: string, userRole: UserRole) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can reassign patients');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const previousOwnerId = patient.ownerId;

    const updated = await this.prisma.patient.update({
      where: { id },
      data: { ownerId: newOwnerId },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Create assignment update
    await this.prisma.update.create({
      data: {
        patientId: id,
        type: UpdateType.ASSIGNMENT,
        content: `Patient assigned to ${updated.owner?.firstName} ${updated.owner?.lastName}`,
        metadata: { previousOwnerId, newOwnerId },
        createdById: userId,
      },
    });

    // Audit log
    await this.auditService.log({
      entityType: 'Patient',
      entityId: id,
      action: AuditAction.ASSIGN,
      userId,
      previousData: { ownerId: previousOwnerId },
      newData: { ownerId: newOwnerId },
    });

    return updated;
  }

  async bulkAssign(patientIds: string[], newOwnerId: string, userId: string) {
    const results = await Promise.all(
      patientIds.map((id) => this.assignOwner(id, newOwnerId, userId, UserRole.ADMIN)),
    );
    return { updated: results.length, patients: results };
  }

  async softDelete(id: string, userId: string, userRole: UserRole) {
    await this.findOne(id, userId, userRole);

    return this.prisma.patient.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  // Contact methods
  async addContact(patientId: string, data: any, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);

    // If setting as primary, unset other primaries
    if (data.isPrimary) {
      await this.prisma.patientContact.updateMany({
        where: { patientId, type: data.type },
        data: { isPrimary: false },
      });
    }

    return this.prisma.patientContact.create({
      data: { ...data, patientId },
    });
  }

  async updateContact(patientId: string, contactId: string, data: any, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);

    if (data.isPrimary) {
      const contact = await this.prisma.patientContact.findUnique({ where: { id: contactId } });
      await this.prisma.patientContact.updateMany({
        where: { patientId, type: contact?.type },
        data: { isPrimary: false },
      });
    }

    return this.prisma.patientContact.update({
      where: { id: contactId },
      data,
    });
  }

  async deleteContact(patientId: string, contactId: string, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);
    return this.prisma.patientContact.delete({ where: { id: contactId } });
  }

  // Address methods
  async addAddress(patientId: string, data: any, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);

    if (data.isPrimary) {
      await this.prisma.address.updateMany({
        where: { patientId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.address.create({
      data: { ...data, patientId },
    });
  }

  async updateAddress(patientId: string, addressId: string, data: any, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);

    if (data.isPrimary) {
      await this.prisma.address.updateMany({
        where: { patientId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  async deleteAddress(patientId: string, addressId: string, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);
    return this.prisma.address.delete({ where: { id: addressId } });
  }

  // Emergency contact methods
  async addEmergencyContact(patientId: string, data: any, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);

    if (data.isPrimary) {
      await this.prisma.emergencyContact.updateMany({
        where: { patientId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.emergencyContact.create({
      data: { ...data, patientId },
    });
  }

  async updateEmergencyContact(patientId: string, ecId: string, data: any, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);

    if (data.isPrimary) {
      await this.prisma.emergencyContact.updateMany({
        where: { patientId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.emergencyContact.update({
      where: { id: ecId },
      data,
    });
  }

  async deleteEmergencyContact(patientId: string, ecId: string, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);
    return this.prisma.emergencyContact.delete({ where: { id: ecId } });
  }

  // Insurance methods
  async addInsurance(patientId: string, data: any, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);

    if (data.isPrimary) {
      await this.prisma.insurancePolicy.updateMany({
        where: { patientId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.insurancePolicy.create({
      data: { ...data, patientId },
    });
  }

  async updateInsurance(patientId: string, policyId: string, data: any, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);

    if (data.isPrimary) {
      await this.prisma.insurancePolicy.updateMany({
        where: { patientId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.insurancePolicy.update({
      where: { id: policyId },
      data,
    });
  }

  async deleteInsurance(patientId: string, policyId: string, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);
    return this.prisma.insurancePolicy.delete({ where: { id: policyId } });
  }

  // Medical info methods (1:1 relationship)
  async getMedicalInfo(patientId: string, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);
    return this.prisma.medicalInfo.findUnique({ where: { patientId } });
  }

  async upsertMedicalInfo(patientId: string, data: any, userId: string, userRole: UserRole) {
    await this.findOne(patientId, userId, userRole);

    return this.prisma.medicalInfo.upsert({
      where: { patientId },
      create: { ...data, patientId },
      update: data,
    });
  }
}
