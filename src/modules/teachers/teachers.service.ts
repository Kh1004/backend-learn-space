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
import {
  CreateTeacherProfileDto,
  UpdateTeacherProfileDto,
  CreateTeacherPostDto,
} from './dto';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  private readonly profileSelect = {
    id: true,
    bio: true,
    institution: true,
    expertise: true,
    qualification: true,
    yearsOfExperience: true,
    website: true,
    socialLinks: true,
    isVerified: true,
    verificationStatus: true,
    verifiedAt: true,
    followerCount: true,
    materialCount: true,
    profileViews: true,
    totalDownloads: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const searchFilter = buildSearchFilter(query.search, [
      'bio',
      'institution',
      'qualification',
    ]);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where = {
      ...softDeleteFilter,
      ...searchFilter,
    };

    const [profiles, total] = await Promise.all([
      this.prisma.teacherProfile.findMany({
        where,
        select: this.profileSelect,
        skip,
        take,
        orderBy,
      }),
      this.prisma.teacherProfile.count({ where }),
    ]);

    return buildPaginatedResult(profiles, query, total);
  }

  async findOne(id: string) {
    const profile = await this.prisma.teacherProfile.findFirst({
      where: { id, deletedAt: null },
      select: this.profileSelect,
    });

    if (!profile) {
      throw new NotFoundException('Teacher profile not found');
    }

    return profile;
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.teacherProfile.findFirst({
      where: { userId, deletedAt: null },
      select: this.profileSelect,
    });

    if (!profile) {
      throw new NotFoundException('Teacher profile not found');
    }

    return profile;
  }

  async create(dto: CreateTeacherProfileDto, userId: string) {
    const existing = await this.prisma.teacherProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Teacher profile already exists for this user');
    }

    const profile = await this.prisma.teacherProfile.create({
      data: {
        userId,
        bio: dto.bio,
        institution: dto.institution,
        expertise: dto.expertise,
        qualification: dto.qualification,
        yearsOfExperience: dto.yearsOfExperience,
        website: dto.website,
        socialLinks: dto.socialLinks,
      },
      select: this.profileSelect,
    });

    this.logger.log(`Teacher profile created for user: ${userId}`);
    return profile;
  }

  async update(id: string, dto: UpdateTeacherProfileDto, userId: string, isAdmin: boolean) {
    const existing = await this.findOne(id);

    if (existing.user.id !== userId && !isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const profile = await this.prisma.teacherProfile.update({
      where: { id },
      data: {
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.institution !== undefined && { institution: dto.institution }),
        ...(dto.expertise !== undefined && { expertise: dto.expertise }),
        ...(dto.qualification !== undefined && { qualification: dto.qualification }),
        ...(dto.yearsOfExperience !== undefined && {
          yearsOfExperience: dto.yearsOfExperience,
        }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.socialLinks !== undefined && { socialLinks: dto.socialLinks }),
      },
      select: this.profileSelect,
    });

    this.logger.log(`Teacher profile updated: ${id}`);
    return profile;
  }

  async verify(id: string, verifiedById: string) {
    const existing = await this.findOne(id);

    if (existing.isVerified) {
      throw new ConflictException('Teacher is already verified');
    }

    const profile = await this.prisma.teacherProfile.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedById,
      },
      select: this.profileSelect,
    });

    this.logger.log(`Teacher verified: ${id} by ${verifiedById}`);
    return profile;
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const existing = await this.findOne(id);

    if (existing.user.id !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    await this.prisma.teacherProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Teacher profile soft-deleted: ${id}`);
    return { message: 'Teacher profile deleted successfully' };
  }
}
