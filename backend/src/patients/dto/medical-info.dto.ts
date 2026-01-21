import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DiagnosisDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  date?: string;
}

class MedicationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  frequency?: string;
}

export class UpsertMedicalInfoDto {
  @ApiPropertyOptional({ example: 'Dr. Smith' })
  @IsString()
  @IsOptional()
  pcpName?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  pcpPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pcpFax?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pcpAddress?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  pcpNpi?: string;

  @ApiPropertyOptional({
    type: [DiagnosisDto],
    example: [{ code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  @IsOptional()
  diagnoses?: DiagnosisDto[];

  @ApiPropertyOptional({ type: [String], example: ['Penicillin'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({
    type: [MedicationDto],
    example: [{ name: 'Metformin', dosage: '500mg', frequency: 'twice daily' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  @IsOptional()
  medications?: MedicationDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
