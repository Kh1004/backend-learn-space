import {
  Controller,
  Get,
  Post,
  Param,
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
import { LikesService } from './likes.service';
import { LikeResponseDto } from './dto';
import { PaginationQueryDto } from '../../common/dtos';
import { ApiPaginatedResponse } from '../../common/decorators';
import type { AuthenticatedRequest } from '../../common/interfaces';

@ApiTags('Likes')
@ApiBearerAuth()
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Get('user/me')
  @ApiOperation({ summary: 'Get current user likes' })
  @ApiPaginatedResponse(LikeResponseDto)
  findByUser(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ) {
    return this.likesService.findByUser(req.user.sub, query);
  }

  @Get('material/:materialId')
  @ApiOperation({ summary: 'Get likes for a material' })
  @ApiParam({ name: 'materialId', description: 'Material UUID' })
  @ApiPaginatedResponse(LikeResponseDto)
  findByMaterial(
    @Param('materialId') materialId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.likesService.findByMaterial(materialId, query);
  }

  @Post('material/:materialId/toggle')
  @ApiOperation({ summary: 'Toggle like on material' })
  @ApiParam({ name: 'materialId', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Like toggled', type: LikeResponseDto })
  toggle(
    @Param('materialId') materialId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.likesService.toggle(req.user.sub, materialId);
  }

  @Get('check/material/:materialId')
  @ApiOperation({ summary: 'Check if current user liked a material' })
  @ApiParam({ name: 'materialId', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Like status' })
  check(
    @Param('materialId') materialId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.likesService.check(req.user.sub, materialId);
  }
}
