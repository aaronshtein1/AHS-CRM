import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CommunicationsService } from './communications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SendEmailDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiProperty()
  @IsString()
  to: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  processInstanceId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}

class SendSmsDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiProperty()
  @IsString()
  to: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  processInstanceId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Communications')
@ApiBearerAuth()
@Controller()
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}

  @Get('patients/:patientId/communications')
  @ApiOperation({ summary: 'Get patient communications' })
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.findByPatient(patientId, user.id, user.role);
  }

  @Get('communications/:id')
  @ApiOperation({ summary: 'Get communication by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post('communications/send-email')
  @ApiOperation({ summary: 'Send email to patient' })
  sendEmail(
    @Body() dto: SendEmailDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.sendEmail(
      {
        ...dto,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      },
      user.id,
      user.role,
    );
  }

  @Post('communications/send-sms')
  @ApiOperation({ summary: 'Send SMS to patient' })
  sendSms(
    @Body() dto: SendSmsDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.sendSms(
      {
        ...dto,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      },
      user.id,
      user.role,
    );
  }
}
