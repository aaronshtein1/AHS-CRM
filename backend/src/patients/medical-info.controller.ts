import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PatientsService } from './patients.service';
import { UpsertMedicalInfoDto } from './dto/medical-info.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Patient Medical Info')
@ApiBearerAuth()
@Controller('patients/:patientId/medical')
export class MedicalInfoController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get patient medical info' })
  findOne(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.getMedicalInfo(patientId, user.id, user.role);
  }

  @Put()
  @ApiOperation({ summary: 'Update patient medical info (creates if not exists)' })
  upsert(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() upsertDto: UpsertMedicalInfoDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.upsertMedicalInfo(patientId, upsertDto, user.id, user.role);
  }
}
