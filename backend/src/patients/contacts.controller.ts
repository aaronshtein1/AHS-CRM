import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PatientsService } from './patients.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Patient Contacts')
@ApiBearerAuth()
@Controller('patients/:patientId/contacts')
export class ContactsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get patient contacts' })
  async findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    // Verify access
    await this.patientsService.findOne(patientId, user.id, user.role);
    return this.prisma.patientContact.findMany({
      where: { patientId },
      orderBy: { isPrimary: 'desc' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add contact to patient' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() createContactDto: CreateContactDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.addContact(patientId, createContactDto, user.id, user.role);
  }

  @Patch(':contactId')
  @ApiOperation({ summary: 'Update patient contact' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() updateContactDto: UpdateContactDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.updateContact(patientId, contactId, updateContactDto, user.id, user.role);
  }

  @Delete(':contactId')
  @ApiOperation({ summary: 'Delete patient contact' })
  remove(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.deleteContact(patientId, contactId, user.id, user.role);
  }
}
