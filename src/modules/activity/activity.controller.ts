import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { CreateActivityDto, ActivityQueryDto } from './dto';
import { PaginationQueryDto } from '../../common/dtos';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import type { AuthenticatedRequest } from '../../common/interfaces';

@ApiTags('Activity')
@ApiBearerAuth()
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all activities (Admin)' })
  @ApiResponse({ status: 200, description: 'Paginated activities' })
  findAll(@Query() query: ActivityQueryDto) {
    return this.activityService.findAll(query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get activities for a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User activities' })
  findByUser(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.activityService.findByUser(userId, query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get activity by ID (Admin)' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity details' })
  findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Log an activity' })
  @ApiResponse({ status: 201, description: 'Activity logged' })
  log(
    @Body() dto: CreateActivityDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.activityService.log(
      dto,
      req.user.sub,
      req.ip,
      req.get('user-agent'),
    );
  }
}
