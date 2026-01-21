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
import { UserRole, TaskStatus, TaskPriority } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateTaskDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  processInstanceId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}

class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'dueToday', required: false, type: Boolean })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  findAll(
    @Query('status') status?: TaskStatus,
    @Query('assignedToId') assignedToId?: string,
    @Query('patientId') patientId?: string,
    @Query('dueToday') dueToday?: boolean,
    @Query('overdue') overdue?: boolean,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.service.findAll(user!.id, user!.role, {
      status,
      assignedToId,
      patientId,
      dueToday,
      overdue,
      skip,
      take,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.findOne(id, user.id, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Create task' })
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.create(
      {
        ...dto,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
      user.id,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.update(
      id,
      {
        ...dto,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
      user.id,
      user.role,
    );
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete task' })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.complete(id, user.id, user.role);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel task' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.cancel(id, user.id, user.role);
  }
}
