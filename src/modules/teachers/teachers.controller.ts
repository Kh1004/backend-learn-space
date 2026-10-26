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
import { TeachersService } from './teachers.service';
import { CreateTeacherProfileDto, UpdateTeacherProfileDto } from './dto';
import { PaginationQueryDto } from '../../common/dtos';
import { Roles, Public } from '../../common/decorators';
import { Role } from '../../common/enums';
import type { AuthenticatedRequest } from '../../common/interfaces';

@ApiTags('Teachers')
@ApiBearerAuth()
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all teacher profiles' })
  @ApiResponse({ status: 200, description: 'Paginated teacher profiles' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.teachersService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get teacher profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  @ApiResponse({ status: 200, description: 'Teacher profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Post()
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Create teacher profile' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  create(
    @Body() dto: CreateTeacherProfileDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teachersService.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update teacher profile (Self/Admin)' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherProfileDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(req.user.role);
    return this.teachersService.update(id, dto, req.user.sub, isAdmin);
  }

  @Post(':id/verify')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verify teacher (Admin)' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  @ApiResponse({ status: 200, description: 'Teacher verified' })
  verify(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teachersService.verify(id, req.user.sub);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete teacher profile (Self/Admin)' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  @ApiResponse({ status: 200, description: 'Profile deleted' })
  remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(req.user.role);
    return this.teachersService.remove(id, req.user.sub, isAdmin);
  }
}
