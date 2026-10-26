import {
  Controller,
  Get,
  Post,
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
import { ReadingProgressService } from './reading-progress.service';
import { UpdateProgressDto } from './dto';
import { PaginationQueryDto } from '../../common/dtos';
import type { AuthenticatedRequest } from '../../common/interfaces';

@ApiTags('Reading Progress')
@ApiBearerAuth()
@Controller('reading-progress')
export class ReadingProgressController {
  constructor(
    private readonly readingProgressService: ReadingProgressService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user reading progress' })
  @ApiResponse({ status: 200, description: 'Paginated reading progress' })
  findByUser(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ) {
    return this.readingProgressService.findByUser(req.user.sub, query);
  }

  @Get('material/:materialId')
  @ApiOperation({ summary: 'Get progress for a specific material' })
  @ApiParam({ name: 'materialId', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Reading progress or null' })
  findByMaterial(
    @Req() req: AuthenticatedRequest,
    @Param('materialId') materialId: string,
  ) {
    return this.readingProgressService.findByMaterial(
      req.user.sub,
      materialId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create or update reading progress' })
  @ApiResponse({ status: 200, description: 'Progress upserted' })
  upsert(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.readingProgressService.upsert(req.user.sub, dto);
  }

  @Delete('material/:materialId')
  @ApiOperation({ summary: 'Delete progress for a material' })
  @ApiParam({ name: 'materialId', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Progress deleted' })
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('materialId') materialId: string,
  ) {
    return this.readingProgressService.remove(req.user.sub, materialId);
  }
}
