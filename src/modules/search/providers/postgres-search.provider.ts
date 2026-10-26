import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  SearchProvider,
  SearchOptions,
  SearchResult,
  SearchableType,
} from '../search.interface';

@Injectable()
export class PostgresSearchProvider implements SearchProvider {
  private readonly logger = new Logger(PostgresSearchProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  async search<T>(options: SearchOptions): Promise<SearchResult<T>> {
    const start = Date.now();
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const types = options.types ?? ['material', 'subject', 'category', 'tag', 'teacher'];
    const results: T[] = [];

    for (const type of types) {
      const items = await this.searchByType(type, options.query, options.filters, limit - results.length);
      results.push(...(items as T[]));
      if (results.length >= limit) break;
    }

    const sorted = options.sortBy
      ? results.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[options.sortBy!];
          const bVal = (b as Record<string, unknown>)[options.sortBy!];
          const aNum = Number(aVal);
          const bNum = Number(bVal);
          if (options.sortOrder === 'asc') return aNum > bNum ? 1 : -1;
          return aNum < bNum ? 1 : -1;
        })
      : results;

    const paged = sorted.slice(skip, skip + limit);

    return {
      items: paged,
      total: results.length,
      page,
      limit,
      query: options.query,
      took: Date.now() - start,
    };
  }

  async index(type: SearchableType, id: string, data: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Index ${type}:${id} (no-op for PostgreSQL)`);
  }

  async remove(type: SearchableType, id: string): Promise<void> {
    this.logger.debug(`Remove ${type}:${id} (no-op for PostgreSQL)`);
  }

  private async searchByType(
    type: SearchableType,
    query: string,
    filters?: Record<string, unknown>,
    limit?: number,
  ): Promise<Record<string, unknown>[]> {
    const searchTerm = `%${query}%`;

    switch (type) {
      case 'material':
        return this.prisma.material.findMany({
          where: {
            deletedAt: null,
            status: 'PUBLISHED',
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
            subjects: filters?.subjectId
              ? { some: { subjectId: filters.subjectId as string } }
              : undefined,
            grades: filters?.gradeId
              ? { some: { gradeId: filters.gradeId as string } }
              : undefined,
            categoryId: (filters?.categoryId as string) ?? undefined,
          },
          take: limit ?? 20,
          orderBy: { viewCount: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            description: true,
            viewCount: true,
          },
        });

      case 'subject':
        return this.prisma.subject.findMany({
          where: {
            deletedAt: null,
            name: { contains: searchTerm, mode: 'insensitive' },
          },
          take: limit ?? 20,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        });

      case 'category':
        return this.prisma.category.findMany({
          where: {
            deletedAt: null,
            name: { contains: searchTerm, mode: 'insensitive' },
          },
          take: limit ?? 20,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        });

      case 'tag':
        return this.prisma.tag.findMany({
          where: {
            deletedAt: null,
            name: { contains: searchTerm, mode: 'insensitive' },
          },
          take: limit ?? 20,
          orderBy: { usageCount: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            usageCount: true,
          },
        });

      case 'teacher':
        return this.prisma.teacherProfile.findMany({
          where: {
            deletedAt: null,
            isVerified: true,
            OR: [
              { institution: { contains: searchTerm, mode: 'insensitive' } },
              { qualification: { contains: searchTerm, mode: 'insensitive' } },
              {
                user: {
                  OR: [
                    { firstName: { contains: searchTerm, mode: 'insensitive' } },
                    { lastName: { contains: searchTerm, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          },
          take: limit ?? 20,
          orderBy: { followerCount: 'desc' },
          select: {
            id: true,
            bio: true,
            institution: true,
            isVerified: true,
            followerCount: true,
            user: { select: { firstName: true, lastName: true } },
          },
        });

      default:
        return [];
    }
  }
}
