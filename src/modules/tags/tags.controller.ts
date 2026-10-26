import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './dto';
import { PaginationQueryDto } from '../../common/dtos';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';

@ApiTags('Tags')
@ApiBearerAuth()
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'Paginated list of tags' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.tagsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag details' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create tag (Admin)' })
  @ApiResponse({ status: 201, description: 'Tag created' })
  @ApiResponse({ status: 409, description: 'Tag already exists' })
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update tag (Admin)' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag updated' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete tag (Admin)' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag deleted' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }

  @Post(':id/restore')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Restore deleted tag (Super Admin)' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag restored' })
  @ApiResponse({ status: 404, description: 'Deleted tag not found' })
  restore(@Param('id') id: string) {
    return this.tagsService.restore(id);
  }
}
