import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface CurrentUserType {
  id: string;
  role: UserRole;
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('my-patients')
  @ApiOperation({ summary: 'Get assigned patients' })
  getMyPatients(@CurrentUser() user: CurrentUserType) {
    return this.service.getMyPatients(user.id, user.role);
  }

  @Get('my-processes')
  @ApiOperation({ summary: 'Get active processes assigned to user' })
  getMyProcesses(@CurrentUser() user: CurrentUserType) {
    return this.service.getMyProcesses(user.id, user.role);
  }

  @Get('due-today')
  @ApiOperation({ summary: 'Get stages due today' })
  getDueToday(@CurrentUser() user: CurrentUserType) {
    return this.service.getDueToday(user.id, user.role);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue stages' })
  getOverdue(@CurrentUser() user: CurrentUserType) {
    return this.service.getOverdue(user.id, user.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats(@CurrentUser() user: CurrentUserType) {
    return this.service.getStats(user.id, user.role);
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity feed' })
  getRecentActivity(
    @Query('limit') limit?: number,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.service.getRecentActivity(user!.id, user!.role, limit || 20);
  }
}
