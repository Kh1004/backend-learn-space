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
import { StudentsService } from './students.service';
import { CreateStudentProfileDto, UpdateStudentProfileDto } from './dto';
import { PaginationQueryDto } from '../../common/dtos';
import { Roles, Public } from '../../common/decorators';
import { Role } from '../../common/enums';
import type { AuthenticatedRequest } from '../../common/interfaces';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all student profiles (Admin)' })
  @ApiResponse({ status: 200, description: 'Paginated student profiles' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  @ApiResponse({ status: 200, description: 'Student profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Create student profile' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  create(
    @Body() dto: CreateStudentProfileDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.studentsService.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update student profile (Self/Admin)' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentProfileDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(req.user.role);
    return this.studentsService.update(id, dto, req.user.sub, isAdmin);
  }

  @Delete(':id')
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete student profile (Self/Admin)' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  @ApiResponse({ status: 200, description: 'Profile deleted' })
  remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(req.user.role);
    return this.studentsService.remove(id, req.user.sub, isAdmin);
  }
}
