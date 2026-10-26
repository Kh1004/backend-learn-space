import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
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
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const searchFilter = buildSearchFilter(query.search, ['name', 'description']);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where: Prisma.CategoryWhereInput = {
      ...softDeleteFilter,
      ...searchFilter,
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { sortOrder: 'asc' },
        include: { _count: { select: { materials: true, children: true } } },
      }),
      this.prisma.category.count({ where }),
    ]);

    return buildPaginatedResult(categories, query, total);
  }

  async findTree() {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    return categories;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { materials: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { materials: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = this.slugify(dto.name);

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder,
      },
    });

    this.logger.log(`Category created: ${category.name}`);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.findOne(id);

    if (dto.name) {
      const newSlug = this.slugify(dto.name);
      const duplicate = await this.prisma.category.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      if (duplicate) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name, slug: this.slugify(dto.name) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Category updated: ${category.name}`);
    return category;
  }

  async remove(id: string) {
    await this.findOne(id);

    const childCount = await this.prisma.category.count({
      where: { parentId: id, deletedAt: null },
    });

    if (childCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with children. Remove children first.',
      );
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Category soft-deleted: ${id}`);
    return { message: 'Category deleted successfully' };
  }

  async restore(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!category) {
      throw new NotFoundException('Deleted category not found');
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`Category restored: ${id}`);
    return { message: 'Category restored successfully' };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
