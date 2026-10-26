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
import { SubjectsService } from './subjects.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectResponseDto,
} from './dto';
import { PaginationQueryDto } from '../../common/dtos';
import { Roles, ApiPaginatedResponse } from '../../common/decorators';
import { Role } from '../../common/enums';

@ApiTags('Subjects')
@ApiBearerAuth()
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiPaginatedResponse(SubjectResponseDto)
  findAll(@Query() query: PaginationQueryDto) {
    return this.subjectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject by ID' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({ status: 200, description: 'Subject details' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create subject (Admin)' })
  @ApiResponse({ status: 201, description: 'Subject created' })
  @ApiResponse({ status: 409, description: 'Subject already exists' })
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update subject (Admin)' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({ status: 200, description: 'Subject updated' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.subjectsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete subject (Admin)' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({ status: 200, description: 'Subject deleted' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }

  @Post(':id/restore')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Restore deleted subject (Super Admin)' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({ status: 200, description: 'Subject restored' })
  @ApiResponse({ status: 404, description: 'Deleted subject not found' })
  restore(@Param('id') id: string) {
    return this.subjectsService.restore(id);
  }
}