import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, PatientStatus } from '@prisma/client';

export class CreatePatientDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiPropertyOptional({ example: 'Michael' })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiPropertyOptional({ example: '1985-06-15' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender, default: Gender.UNKNOWN })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ssn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: PatientStatus, default: PatientStatus.ACTIVE })
  @IsEnum(PatientStatus)
  @IsOptional()
  status?: PatientStatus;

  @ApiPropertyOptional({ description: 'Assigned owner/rep user ID' })
  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
