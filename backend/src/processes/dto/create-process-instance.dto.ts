import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProcessInstanceDto {
  @ApiProperty({ description: 'Process template ID' })
  @IsUUID()
  processTemplateId: string;

  @ApiPropertyOptional({ description: 'Assigned user ID (defaults to patient owner)' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AdvanceStageDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Checklist item completion status' })
  @IsOptional()
  checklistStatus?: Record<string, boolean>;
}

export class ProcessActionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
