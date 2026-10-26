import { Controller, Get, Param, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { AuthenticatedRequest } from '../../common/interfaces';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Get teacher dashboard analytics' })
  @ApiParam({ name: 'teacherId', description: 'Teacher User UUID' })
  @ApiResponse({ status: 200, description: 'Teacher dashboard data' })
  getTeacherDashboard(@Param('teacherId') teacherId: string) {
    return this.analyticsService.getTeacherDashboard(teacherId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get student dashboard analytics' })
  @ApiParam({ name: 'studentId', description: 'Student User UUID' })
  @ApiResponse({ status: 200, description: 'Student dashboard data' })
  getStudentDashboard(@Param('studentId') studentId: string) {
    return this.analyticsService.getStudentDashboard(studentId);
  }

  @Get('admin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard analytics (Admin)' })
  @ApiResponse({ status: 200, description: 'Admin dashboard data' })
  getAdminDashboard() {
    return this.analyticsService.getAdminDashboard();
  }
}
