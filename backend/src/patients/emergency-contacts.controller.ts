import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PatientsService } from './patients.service';
import { CreateEmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Patient Emergency Contacts')
@ApiBearerAuth()
@Controller('patients/:patientId/emergency-contacts')
export class EmergencyContactsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get patient emergency contacts' })
  async findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.patientsService.findOne(patientId, user.id, user.role);
    return this.prisma.emergencyContact.findMany({
      where: { patientId },
      orderBy: { isPrimary: 'desc' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add emergency contact to patient' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() createDto: CreateEmergencyContactDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.addEmergencyContact(patientId, createDto, user.id, user.role);
  }

  @Patch(':ecId')
  @ApiOperation({ summary: 'Update patient emergency contact' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('ecId', ParseUUIDPipe) ecId: string,
    @Body() updateDto: UpdateEmergencyContactDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.updateEmergencyContact(patientId, ecId, updateDto, user.id, user.role);
  }

  @Delete(':ecId')
  @ApiOperation({ summary: 'Delete patient emergency contact' })
  remove(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('ecId', ParseUUIDPipe) ecId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.deleteEmergencyContact(patientId, ecId, user.id, user.role);
  }
}
