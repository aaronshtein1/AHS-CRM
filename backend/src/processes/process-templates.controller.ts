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
import { ProcessTemplatesService } from './process-templates.service';
import { CreateProcessTemplateDto } from './dto/create-process-template.dto';
import { UpdateProcessTemplateDto } from './dto/update-process-template.dto';
import { CreateStageTemplateDto, UpdateStageTemplateDto } from './dto/stage-template.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Process Templates')
@ApiBearerAuth()
@Controller('process-templates')
export class ProcessTemplatesController {
  constructor(private readonly service: ProcessTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all process templates' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(@Query('includeInactive') includeInactive?: boolean) {
    return this.service.findAll({ includeInactive });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get process template by ID with stages and automations' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new process template (Admin only)' })
  create(
    @Body() createDto: CreateProcessTemplateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(createDto, userId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update process template (Admin only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProcessTemplateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(id, updateDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate process template (Admin only)' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.deactivate(id, userId);
  }

  // Stage Template endpoints
  @Post(':id/stages')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add stage to process template (Admin only)' })
  addStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateStageTemplateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.addStage(id, createDto, userId);
  }

  @Patch(':id/stages/:stageId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update stage template (Admin only)' })
  updateStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() updateDto: UpdateStageTemplateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.updateStage(id, stageId, updateDto, userId);
  }

  @Delete(':id/stages/:stageId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete stage template (Admin only)' })
  deleteStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.deleteStage(id, stageId, userId);
  }

  @Post(':id/stages/reorder')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reorder stages (Admin only)' })
  reorderStages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() stageOrder: { id: string; order: number }[],
    @CurrentUser('id') userId: string,
  ) {
    return this.service.reorderStages(id, stageOrder, userId);
  }
}
