import { Controller, Get, Post, Param, Query, Req, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorators';
import { BookmarksService } from './bookmarks.service';
import { PaginationQueryDto } from '../../common/dtos';
import type { AuthenticatedRequest } from '../../common/interfaces';
import { BookmarkMaterialDto, BookmarkResponseDto } from './dto';

@ApiTags('Bookmarks')
@ApiBearerAuth()
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user bookmarks' })
  @ApiPaginatedResponse(BookmarkResponseDto)
  findByUser(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ) {
    return this.bookmarksService.findByUser(req.user.sub, query);
  }

  @Post()
  @ApiOperation({ summary: 'Toggle bookmark on a material' })
  @ApiResponse({ status: 200, description: 'Bookmark toggled' })
  toggle(
    @Req() req: AuthenticatedRequest,
    @Body() dto: BookmarkMaterialDto,
  ) {
    return this.bookmarksService.toggle(req.user.sub, dto.materialId);
  }

  @Get('check/:materialId')
  @ApiOperation({ summary: 'Check if material is bookmarked' })
  @ApiParam({ name: 'materialId', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Bookmark status' })
  check(
    @Req() req: AuthenticatedRequest,
    @Param('materialId') materialId: string,
  ) {
    return this.bookmarksService.check(req.user.sub, materialId);
  }
}
