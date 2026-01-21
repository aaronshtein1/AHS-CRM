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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, TriggerType } from '@prisma/client';
import { AutomationService } from './automation.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, IsOptional, IsEnum, IsArray, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateAutomationRuleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TriggerType })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  triggerStageId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  delayMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiProperty({ type: 'array' })
  @IsArray()
  actions: Array<{
    type: 'SEND_EMAIL' | 'SEND_SMS' | 'CREATE_TASK' | 'ADD_UPDATE' | 'NOTIFY_REP';
    config: Record<string, any>;
  }>;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  order?: number;
}

@ApiTags('Automation Rules')
@ApiBearerAuth()
@Controller('process-templates/:templateId/automations')
export class AutomationController {
  constructor(private readonly service: AutomationService) {}

  @Get()
  @ApiOperation({ summary: 'Get automation rules for a template' })
  findByTemplate(@Param('templateId', ParseUUIDPipe) templateId: string) {
    return this.service.findByTemplate(templateId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create automation rule (Admin only)' })
  create(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() dto: CreateAutomationRuleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.createRule({ ...dto, processTemplateId: templateId }, userId);
  }

  @Patch(':ruleId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update automation rule (Admin only)' })
  update(
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() dto: Partial<CreateAutomationRuleDto>,
  ) {
    return this.service.updateRule(ruleId, dto);
  }

  @Delete(':ruleId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete automation rule (Admin only)' })
  delete(@Param('ruleId', ParseUUIDPipe) ruleId: string) {
    return this.service.deleteRule(ruleId);
  }
}

// Separate controller for job management
@ApiTags('Automation Jobs')
@ApiBearerAuth()
@Controller('automation-jobs')
export class AutomationJobsController {
  constructor(private readonly service: AutomationService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pending automation jobs (Admin only)' })
  getPendingJobs(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.service.getPendingJobs({ skip, take });
  }

  @Get(':jobId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get job status (Admin only)' })
  getJobStatus(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.service.getJobStatus(jobId);
  }
}
