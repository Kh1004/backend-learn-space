import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ReportsService } from './reports.service';
import { CreateReportDto, ResolveReportDto } from './dto';
import { PaginationQueryDto } from '../../common/dtos';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import type { AuthenticatedRequest } from '../../common/interfaces';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all reports (Admin)' })
  @ApiResponse({ status: 200, description: 'Paginated reports' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.reportsService.findAll(query);
  }

  @Get('material/:materialId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get reports for a material (Admin)' })
  @ApiParam({ name: 'materialId', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Reports for material' })
  findByMaterial(
    @Param('materialId') materialId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reportsService.findByMaterial(materialId, query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get report by ID (Admin)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 200, description: 'Report details' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Report a material' })
  @ApiResponse({ status: 201, description: 'Report created' })
  @ApiResponse({ status: 409, description: 'Open report already exists' })
  create(@Body() dto: CreateReportDto, @Req() req: AuthenticatedRequest) {
    return this.reportsService.create(dto, req.user.sub);
  }

  @Patch(':id/resolve')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resolve report (Admin)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 200, description: 'Report resolved' })
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reportsService.resolve(id, dto, req.user.sub);
  }

  @Patch(':id/dismiss')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Dismiss report (Admin)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 200, description: 'Report dismissed' })
  dismiss(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reportsService.dismiss(id, req.user.sub);
  }
}
