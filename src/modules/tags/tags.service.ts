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
import { CreateTagDto, UpdateTagDto } from './dto';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const searchFilter = buildSearchFilter(query.search, ['name']);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where = {
      ...softDeleteFilter,
      ...searchFilter,
    };

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { usageCount: 'desc' },
      }),
      this.prisma.tag.count({ where }),
    ]);

    return buildPaginatedResult(tags, query, total);
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, deletedAt: null },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async findBySlug(slug: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { slug, deletedAt: null },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async create(dto: CreateTagDto) {
    const slug = this.slugify(dto.name);

    const existing = await this.prisma.tag.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Tag with this name already exists');
    }

    const tag = await this.prisma.tag.create({
      data: { name: dto.name, slug },
    });

    this.logger.log(`Tag created: ${tag.name}`);
    return tag;
  }

  async update(id: string, dto: UpdateTagDto) {
    await this.findOne(id);

    if (dto.name) {
      const newSlug = this.slugify(dto.name);
      const duplicate = await this.prisma.tag.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      if (duplicate) {
        throw new ConflictException('Tag with this name already exists');
      }
    }

    const tag = await this.prisma.tag.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name, slug: this.slugify(dto.name) }),
      },
    });

    this.logger.log(`Tag updated: ${tag.name}`);
    return tag;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.tag.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Tag soft-deleted: ${id}`);
    return { message: 'Tag deleted successfully' };
  }

  async restore(id: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!tag) {
      throw new NotFoundException('Deleted tag not found');
    }

    await this.prisma.tag.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`Tag restored: ${id}`);
    return { message: 'Tag restored successfully' };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
