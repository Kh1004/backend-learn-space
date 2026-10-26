import { Controller, Get, Post, Param, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { PaginationQueryDto } from '../../common/dtos';
import type { AuthenticatedRequest } from '../../common/interfaces';

@ApiTags('Follows')
@ApiBearerAuth()
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':userId')
  @ApiOperation({ summary: 'Toggle follow a user' })
  @ApiParam({ name: 'userId', description: 'User UUID to follow/unfollow' })
  @ApiResponse({ status: 200, description: 'Follow status toggled' })
  @ApiResponse({ status: 403, description: 'Cannot follow yourself' })
  toggle(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
  ) {
    return this.followsService.toggle(req.user.sub, userId);
  }

  @Get(':userId/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Paginated followers' })
  getFollowers(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.followsService.getFollowers(userId, query);
  }

  @Get(':userId/following')
  @ApiOperation({ summary: 'Get who user follows' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Paginated following' })
  getFollowing(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.followsService.getFollowing(userId, query);
  }

  @Get('check/:userId')
  @ApiOperation({ summary: 'Check if following a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Follow status' })
  check(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
  ) {
    return this.followsService.check(req.user.sub, userId);
  }
}
