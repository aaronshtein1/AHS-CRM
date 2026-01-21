import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OutcomeType } from '@prisma/client';

export class CreateStageTemplateDto {
  @ApiProperty({ example: 'Contact Attempt 1' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  dueDays?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFinalStage?: boolean;

  @ApiPropertyOptional({ enum: OutcomeType, default: OutcomeType.NONE })
  @IsEnum(OutcomeType)
  @IsOptional()
  outcomeType?: OutcomeType;

  @ApiPropertyOptional({ type: [String], example: ['medicaidId'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredFields?: string[];

  @ApiPropertyOptional({
    type: 'array',
    example: [{ item: 'Call made', required: true }],
  })
  @IsArray()
  @IsOptional()
  checklist?: { item: string; required: boolean }[];

  @ApiPropertyOptional({ type: [String], description: 'IDs of stages that can be transitioned to' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedNextStages?: string[];
}

export class UpdateStageTemplateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  dueDays?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFinalStage?: boolean;

  @ApiPropertyOptional({ enum: OutcomeType })
  @IsEnum(OutcomeType)
  @IsOptional()
  outcomeType?: OutcomeType;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredFields?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  checklist?: { item: string; required: boolean }[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedNextStages?: string[];
}
