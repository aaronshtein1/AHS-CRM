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
import { CreateInsuranceDto, UpdateInsuranceDto } from './dto/insurance.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Patient Insurance')
@ApiBearerAuth()
@Controller('patients/:patientId/insurance')
export class InsuranceController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get patient insurance policies' })
  async findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.patientsService.findOne(patientId, user.id, user.role);
    return this.prisma.insurancePolicy.findMany({
      where: { patientId },
      orderBy: { isPrimary: 'desc' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add insurance policy to patient' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() createDto: CreateInsuranceDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.addInsurance(patientId, createDto, user.id, user.role);
  }

  @Patch(':policyId')
  @ApiOperation({ summary: 'Update patient insurance policy' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Body() updateDto: UpdateInsuranceDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.updateInsurance(patientId, policyId, updateDto, user.id, user.role);
  }

  @Delete(':policyId')
  @ApiOperation({ summary: 'Delete patient insurance policy' })
  remove(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.deleteInsurance(patientId, policyId, user.id, user.role);
  }
}
