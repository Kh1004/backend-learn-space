import {
  Injectable,
  NotFoundException,
  ConflictException,
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
import { CreateGradeDto, UpdateGradeDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const searchFilter = buildSearchFilter(query.search, ['name', 'description']);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where: Prisma.GradeWhereInput = {
      ...softDeleteFilter,
      ...searchFilter,
    };

    const [grades, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { level: 'asc' },
      }),
      this.prisma.grade.count({ where }),
    ]);

    return buildPaginatedResult(grades, query, total);
  }

  async findOne(id: string) {
    const grade = await this.prisma.grade.findFirst({
      where: { id, deletedAt: null },
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return grade;
  }

  async findBySlug(slug: string) {
    const grade = await this.prisma.grade.findFirst({
      where: { slug, deletedAt: null },
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return grade;
  }

  async create(dto: CreateGradeDto) {
    const slug = this.slugify(dto.name);

    const existingSlug = await this.prisma.grade.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException('Grade with this name already exists');
    }

    const existingLevel = await this.prisma.grade.findUnique({
      where: { level: dto.level },
    });
    if (existingLevel) {
      throw new ConflictException('Grade with this level already exists');
    }

    const grade = await this.prisma.grade.create({
      data: {
        name: dto.name,
        slug,
        level: dto.level,
        description: dto.description,
      },
    });

    this.logger.log(`Grade created: ${grade.name}`);
    return grade;
  }

  async update(id: string, dto: UpdateGradeDto) {
    await this.findOne(id);

    if (dto.name) {
      const newSlug = this.slugify(dto.name);
      const existing = await this.prisma.grade.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Grade with this name already exists');
      }
    }

    if (dto.level !== undefined) {
      const existing = await this.prisma.grade.findFirst({
        where: { level: dto.level, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Grade with this level already exists');
      }
    }

    const grade = await this.prisma.grade.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name, slug: this.slugify(dto.name) }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Grade updated: ${grade.name}`);
    return grade;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.grade.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Grade soft-deleted: ${id}`);
    return { message: 'Grade deleted successfully' };
  }

  async restore(id: string) {
    const grade = await this.prisma.grade.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!grade) {
      throw new NotFoundException('Deleted grade not found');
    }

    await this.prisma.grade.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`Grade restored: ${id}`);
    return { message: 'Grade restored successfully' };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
