import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole, UpdateType } from '@prisma/client';
import { UpdatesService } from './updates.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Updates')
@ApiBearerAuth()
@Controller()
export class UpdatesController {
  constructor(private readonly service: UpdatesService) {}

  @Get('patients/:patientId/updates')
  @ApiOperation({ summary: 'Get patient timeline/updates' })
  @ApiQuery({ name: 'type', required: false, enum: UpdateType })
  @ApiQuery({ name: 'processInstanceId', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('type') type?: UpdateType,
    @Query('processInstanceId') processInstanceId?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.service.findByPatient(patientId, user!.id, user!.role, {
      type,
      processInstanceId,
      skip,
      take,
    });
  }

  @Post('patients/:patientId/updates')
  @ApiOperation({ summary: 'Add manual update to patient timeline' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body('content') content: string,
    @Body('processInstanceId') processInstanceId?: string,
    @Body('stageInstanceId') stageInstanceId?: string,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.service.create(patientId, content, user!.id, user!.role, {
      processInstanceId,
      stageInstanceId,
    });
  }

  @Patch('updates/:id/redact')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Redact an update (Admin only)' })
  redact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.service.redact(id, reason, user!.id, user!.role);
  }
}
