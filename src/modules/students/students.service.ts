import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../../common/dtos';
import {
  buildPaginatedResult,
  buildPrismaQueryOptions,
} from '../../common/utils';
import {
  buildSearchFilter,
  buildSoftDeleteFilter,
} from '../../database/helpers';
import { CreateStudentProfileDto, UpdateStudentProfileDto } from './dto';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  private readonly profileSelect = {
    id: true,
    gradeId: true,
    institution: true,
    enrollmentYear: true,
    interests: true,
    readingGoal: true,
    totalReadTime: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: { id: true, firstName: true, lastName: true, email: true },
    },
    grade: {
      select: { id: true, name: true, slug: true, level: true },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const searchFilter = buildSearchFilter(query.search, ['institution']);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where = {
      ...softDeleteFilter,
      ...searchFilter,
    };

    const [profiles, total] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where,
        select: this.profileSelect,
        skip,
        take,
        orderBy,
      }),
      this.prisma.studentProfile.count({ where }),
    ]);

    return buildPaginatedResult(profiles, query, total);
  }

  async findOne(id: string) {
    const profile = await this.prisma.studentProfile.findFirst({
      where: { id, deletedAt: null },
      select: this.profileSelect,
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    return profile;
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.studentProfile.findFirst({
      where: { userId, deletedAt: null },
      select: this.profileSelect,
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    return profile;
  }

  async create(dto: CreateStudentProfileDto, userId: string) {
    const existing = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Student profile already exists');
    }

    const profile = await this.prisma.studentProfile.create({
      data: {
        userId,
        gradeId: dto.gradeId,
        institution: dto.institution,
        enrollmentYear: dto.enrollmentYear,
        interests: dto.interests,
        readingGoal: dto.readingGoal,
      },
      select: this.profileSelect,
    });

    this.logger.log(`Student profile created for user: ${userId}`);
    return profile;
  }

  async update(id: string, dto: UpdateStudentProfileDto, userId: string, isAdmin: boolean) {
    const existing = await this.findOne(id);

    if (existing.user.id !== userId && !isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const profile = await this.prisma.studentProfile.update({
      where: { id },
      data: {
        ...(dto.gradeId !== undefined && { gradeId: dto.gradeId }),
        ...(dto.institution !== undefined && { institution: dto.institution }),
        ...(dto.enrollmentYear !== undefined && {
          enrollmentYear: dto.enrollmentYear,
        }),
        ...(dto.interests !== undefined && { interests: dto.interests }),
        ...(dto.readingGoal !== undefined && { readingGoal: dto.readingGoal }),
      },
      select: this.profileSelect,
    });

    this.logger.log(`Student profile updated: ${id}`);
    return profile;
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const existing = await this.findOne(id);

    if (existing.user.id !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    await this.prisma.studentProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Student profile soft-deleted: ${id}`);
    return { message: 'Student profile deleted successfully' };
  }
}
