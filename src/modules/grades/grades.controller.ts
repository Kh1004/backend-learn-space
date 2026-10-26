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
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto } from './dto';
import { PaginationQueryDto } from '../../common/dtos';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';

@ApiTags('Grades')
@ApiBearerAuth()
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all grades' })
  @ApiResponse({ status: 200, description: 'Paginated list of grades' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.gradesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get grade by ID' })
  @ApiParam({ name: 'id', description: 'Grade UUID' })
  @ApiResponse({ status: 200, description: 'Grade details' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  findOne(@Param('id') id: string) {
    return this.gradesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create grade (Admin)' })
  @ApiResponse({ status: 201, description: 'Grade created' })
  @ApiResponse({ status: 409, description: 'Grade already exists' })
  create(@Body() dto: CreateGradeDto) {
    return this.gradesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update grade (Admin)' })
  @ApiParam({ name: 'id', description: 'Grade UUID' })
  @ApiResponse({ status: 200, description: 'Grade updated' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  update(@Param('id') id: string, @Body() dto: UpdateGradeDto) {
    return this.gradesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete grade (Admin)' })
  @ApiParam({ name: 'id', description: 'Grade UUID' })
  @ApiResponse({ status: 200, description: 'Grade deleted' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  remove(@Param('id') id: string) {
    return this.gradesService.remove(id);
  }

  @Post(':id/restore')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Restore deleted grade (Super Admin)' })
  @ApiParam({ name: 'id', description: 'Grade UUID' })
  @ApiResponse({ status: 200, description: 'Grade restored' })
  @ApiResponse({ status: 404, description: 'Deleted grade not found' })
  restore(@Param('id') id: string) {
    return this.gradesService.restore(id);
  }
}
