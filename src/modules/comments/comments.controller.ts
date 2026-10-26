import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { CommentsService } from './comments.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryDto,
  CommentResponseDto,
} from './dto';
import { Roles, Public, ApiPaginatedResponse } from '../../common/decorators';
import { Role } from '../../common/enums';
import type { AuthenticatedRequest } from '../../common/interfaces';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('material/:materialId')
  @Public()
  @ApiOperation({ summary: 'Get comments for a material' })
  @ApiParam({ name: 'materialId', description: 'Material UUID' })
  @ApiPaginatedResponse(CommentResponseDto)
  findByMaterial(
    @Param('materialId') materialId: string,
    @Query() query: CommentQueryDto,
  ) {
    return this.commentsService.findByMaterial(materialId, query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment details' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create comment or reply' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  create(
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.create(dto, req.user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit comment (Owner/Admin)' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(req.user.role);
    return this.commentsService.update(id, dto, req.user.sub, isAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment (Owner/Admin)' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(req.user.role);
    return this.commentsService.remove(id, req.user.sub, isAdmin);
  }

  @Post(':id/pin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Pin/unpin comment (Admin)' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Pin toggled' })
  togglePin(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(req.user.role);
    return this.commentsService.togglePin(id, isAdmin);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like comment' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Like count incremented' })
  like(@Param('id') id: string) {
    return this.commentsService.like(id);
  }
}
