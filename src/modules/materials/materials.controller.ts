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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MaterialsService } from './materials.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  MaterialQueryDto,
  MaterialResponseDto,
} from './dto';
import { Roles, Public, ApiPaginatedResponse } from '../../common/decorators';
import { Role } from '../../common/enums';
import type { AuthenticatedRequest } from '../../common/interfaces';
import { MaterialViewedEvent } from '../../common/events';

@ApiTags('Materials')
@ApiBearerAuth()
@Controller('materials')
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all materials (public, paginated)' })
  @ApiPaginatedResponse(MaterialResponseDto)
  findAll(@Query() query: MaterialQueryDto) {
    return this.materialsService.findAll(query);
  }

  @Get('published')
  @Public()
  @ApiOperation({ summary: 'Get published materials only' })
  @ApiResponse({ status: 200, description: 'Published materials' })
  findPublished(@Query() query: MaterialQueryDto) {
    return this.materialsService.findPublished(query);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get material by slug' })
  @ApiParam({ name: 'slug', description: 'Material slug' })
  @ApiResponse({ status: 200, description: 'Material details' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.materialsService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get material by ID' })
  @ApiParam({ name: 'id', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Material details' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const material = await this.materialsService.findOne(id);

    this.eventEmitter.emit(
      MaterialViewedEvent.ACTION,
      new MaterialViewedEvent(
        req.user?.sub ?? 'anonymous',
        id,
      ),
    );

    return material;
  }

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create material (Teacher/Admin)' })
  @ApiResponse({ status: 201, description: 'Material created' })
  create(
    @Body() dto: CreateMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materialsService.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update material (Author/Admin)' })
  @ApiParam({ name: 'id', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Material updated' })
  @ApiResponse({ status: 403, description: 'Not the author' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materialsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete material (Author/Admin)' })
  @ApiParam({ name: 'id', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Material deleted' })
  remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materialsService.remove(id, req.user.sub);
  }

  @Post(':id/publish')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Publish material (Author/Admin)' })
  @ApiParam({ name: 'id', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Material published' })
  publish(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materialsService.publish(id, req.user.sub);
  }

  @Post(':id/archive')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Archive material (Author/Admin)' })
  @ApiParam({ name: 'id', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Material archived' })
  archive(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materialsService.archive(id, req.user.sub);
  }

  @Post(':id/restore')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Restore deleted material (Author/Admin)' })
  @ApiParam({ name: 'id', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Material restored' })
  restore(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materialsService.restore(id, req.user.sub);
  }
}
