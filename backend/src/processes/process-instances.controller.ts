import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ProcessInstancesService } from './process-instances.service';
import {
  CreateProcessInstanceDto,
  AdvanceStageDto,
  ProcessActionDto,
} from './dto/create-process-instance.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Process Instances')
@ApiBearerAuth()
@Controller()
export class ProcessInstancesController {
  constructor(private readonly service: ProcessInstancesService) {}

  @Post('patients/:patientId/processes')
  @ApiOperation({ summary: 'Start a new process for a patient' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() createDto: CreateProcessInstanceDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.create(patientId, createDto, user.id, user.role);
  }

  @Get('patients/:patientId/processes')
  @ApiOperation({ summary: 'Get all processes for a patient' })
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.findByPatient(patientId, user.id, user.role);
  }

  @Get('process-instances/:id')
  @ApiOperation({ summary: 'Get process instance by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.findOne(id, user.id, user.role);
  }

  @Post('process-instances/:id/stages/:stageId/advance')
  @ApiOperation({ summary: 'Advance to a stage' })
  advanceStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() advanceDto: AdvanceStageDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.advanceStage(id, stageId, advanceDto, user.id, user.role);
  }

  @Patch('process-instances/:id/stages/:stageId/checklist')
  @ApiOperation({ summary: 'Update stage checklist' })
  updateChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body('checklistStatus') checklistStatus: Record<string, boolean>,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.updateStageChecklist(id, stageId, checklistStatus, user.id, user.role);
  }

  @Post('process-instances/:id/cancel')
  @ApiOperation({ summary: 'Cancel process' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() actionDto: ProcessActionDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.cancel(id, actionDto.reason || '', user.id, user.role);
  }

  @Post('process-instances/:id/hold')
  @ApiOperation({ summary: 'Put process on hold' })
  hold(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() actionDto: ProcessActionDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.hold(id, actionDto.reason || '', user.id, user.role);
  }

  @Post('process-instances/:id/resume')
  @ApiOperation({ summary: 'Resume process from hold' })
  resume(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.resume(id, user.id, user.role);
  }

  @Post('process-instances/:id/reopen')
  @ApiOperation({ summary: 'Reopen completed/cancelled process (creates new instance)' })
  reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.reopen(id, user.id, user.role);
  }

  @Post('process-instances/:id/assign')
  @ApiOperation({ summary: 'Assign process to a user' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assignedToId', ParseUUIDPipe) assignedToId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.assignTo(id, assignedToId, user.id, user.role);
  }
}
