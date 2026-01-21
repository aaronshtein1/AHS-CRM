import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressType } from '@prisma/client';

export class CreateAddressDto {
  @ApiPropertyOptional({ enum: AddressType, default: AddressType.HOME })
  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  street1: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsString()
  @IsOptional()
  street2?: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  state: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  zipCode: string;

  @ApiPropertyOptional({ example: 'New York County' })
  @IsString()
  @IsOptional()
  county?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ enum: AddressType })
  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  street1?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  street2?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  county?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}
