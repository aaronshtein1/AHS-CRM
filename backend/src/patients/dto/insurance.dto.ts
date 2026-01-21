import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InsuranceType, VerificationStatus } from '@prisma/client';

export class CreateInsuranceDto {
  @ApiProperty({ enum: InsuranceType })
  @IsEnum(InsuranceType)
  type: InsuranceType;

  @ApiProperty({ example: 'Medicaid' })
  @IsString()
  payerName: string;

  @ApiPropertyOptional({ example: 'ABC123456789' })
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupNumber?: string;

  @ApiPropertyOptional({ description: 'Medicaid CIN if applicable' })
  @IsString()
  @IsOptional()
  cin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  planName?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  terminationDate?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ enum: VerificationStatus, default: VerificationStatus.PENDING })
  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInsuranceDto {
  @ApiPropertyOptional({ enum: InsuranceType })
  @IsEnum(InsuranceType)
  @IsOptional()
  type?: InsuranceType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  payerName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  planName?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  terminationDate?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
