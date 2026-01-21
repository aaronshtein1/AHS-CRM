import { IsString, IsOptional, IsInt, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProcessTemplateDto {
  @ApiProperty({ example: 'Medicaid Eligibility + Intake' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'Process for new patient intake and Medicaid eligibility verification' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsInt()
  @Min(1)
  @IsOptional()
  defaultDueDays?: number;
}
