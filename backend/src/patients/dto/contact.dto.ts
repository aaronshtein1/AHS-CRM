import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType, ContactLabel } from '@prisma/client';

export class CreateContactDto {
  @ApiProperty({ enum: ContactType })
  @IsEnum(ContactType)
  type: ContactType;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ enum: ContactLabel, default: ContactLabel.OTHER })
  @IsEnum(ContactLabel)
  @IsOptional()
  label?: ContactLabel;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  canContact?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  canText?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  doNotContact?: boolean;
}

export class UpdateContactDto {
  @ApiPropertyOptional({ enum: ContactType })
  @IsEnum(ContactType)
  @IsOptional()
  type?: ContactType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  value?: string;

  @ApiPropertyOptional({ enum: ContactLabel })
  @IsEnum(ContactLabel)
  @IsOptional()
  label?: ContactLabel;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  canContact?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  canText?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  doNotContact?: boolean;
}
