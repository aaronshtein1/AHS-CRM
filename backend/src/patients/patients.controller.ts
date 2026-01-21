import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  create(
    @Body() createPatientDto: CreatePatientDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.create(createPatientDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List patients with search and filters' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'hasActiveProcess', required: false, type: Boolean })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
    @Query('ownerId') ownerId?: string,
    @Query('status') status?: string,
    @Query('hasActiveProcess') hasActiveProcess?: boolean,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.patientsService.findAll({
      skip,
      take,
      search,
      ownerId,
      status,
      hasActiveProcess,
      userId: user!.id,
      userRole: user!.role,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID with all related data' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.update(id, updatePatientDto, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete patient (set status to INACTIVE)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.softDelete(id, user.id, user.role);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign patient to a rep (Admin only)' })
  assignOwner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('ownerId', ParseUUIDPipe) ownerId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.assignOwner(id, ownerId, user.id, user.role);
  }

  @Post('bulk-assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk assign patients to a rep (Admin only)' })
  bulkAssign(
    @Body('patientIds') patientIds: string[],
    @Body('ownerId', ParseUUIDPipe) ownerId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.bulkAssign(patientIds, ownerId, user.id);
  }
}
