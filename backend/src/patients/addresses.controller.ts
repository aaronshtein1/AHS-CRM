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
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Patient Addresses')
@ApiBearerAuth()
@Controller('patients/:patientId/addresses')
export class AddressesController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get patient addresses' })
  async findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.patientsService.findOne(patientId, user.id, user.role);
    return this.prisma.address.findMany({
      where: { patientId },
      orderBy: { isPrimary: 'desc' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add address to patient' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() createAddressDto: CreateAddressDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.addAddress(patientId, createAddressDto, user.id, user.role);
  }

  @Patch(':addressId')
  @ApiOperation({ summary: 'Update patient address' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.updateAddress(patientId, addressId, updateAddressDto, user.id, user.role);
  }

  @Delete(':addressId')
  @ApiOperation({ summary: 'Delete patient address' })
  remove(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.patientsService.deleteAddress(patientId, addressId, user.id, user.role);
  }
}
