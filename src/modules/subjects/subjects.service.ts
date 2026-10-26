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
import { CreateSubjectDto, UpdateSubjectDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const searchFilter = buildSearchFilter(query.search, ['name', 'description']);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where: Prisma.SubjectWhereInput = {
      ...softDeleteFilter,
      ...searchFilter,
    };

    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.subject.count({ where }),
    ]);

    return buildPaginatedResult(subjects, query, total);
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  async findBySlug(slug: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { slug, deletedAt: null },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  async create(dto: CreateSubjectDto) {
    const slug = this.slugify(dto.name);

    const existing = await this.prisma.subject.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Subject with this name already exists');
    }

    const subject = await this.prisma.subject.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        sortOrder: dto.sortOrder,
      },
    });

    this.logger.log(`Subject created: ${subject.name}`);
    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto) {
    await this.findOne(id);

    if (dto.name) {
      const newSlug = this.slugify(dto.name);
      const existing = await this.prisma.subject.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Subject with this name already exists');
      }
    }

    const subject = await this.prisma.subject.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name, slug: this.slugify(dto.name) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Subject updated: ${subject.name}`);
    return subject;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Subject soft-deleted: ${id}`);
    return { message: 'Subject deleted successfully' };
  }

  async restore(id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!subject) {
      throw new NotFoundException('Deleted subject not found');
    }

    await this.prisma.subject.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`Subject restored: ${id}`);
    return { message: 'Subject restored successfully' };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}