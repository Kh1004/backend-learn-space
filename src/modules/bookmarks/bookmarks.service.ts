import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../../common/dtos';
import {
  buildPaginatedResult,
  buildPrismaQueryOptions,
} from '../../common/utils';
import { MaterialBookmarkedEvent, ActivityEvent, ActivityType } from '../../common/events';

@Injectable()
export class BookmarksService {
  private readonly logger = new Logger(BookmarksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findByUser(userId: string, query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);

    const where = { userId };

    const [bookmarks, total] = await Promise.all([
      this.prisma.materialBookmark.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          material: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              status: true,
              readingTime: true,
              viewCount: true,
              author: {
                select: { id: true, firstName: true, lastName: true },
              },
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      this.prisma.materialBookmark.count({ where }),
    ]);

    return buildPaginatedResult(bookmarks, query, total);
  }

  async toggle(userId: string, materialId: string) {
    const material = await this.prisma.material.findFirst({
      where: { id: materialId, deletedAt: null },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const existing = await this.prisma.materialBookmark.findUnique({
      where: { materialId_userId: { materialId, userId } },
    });

    if (existing) {
      await this.prisma.materialBookmark.delete({
        where: { id: existing.id },
      });

      await this.prisma.material.update({
        where: { id: materialId },
        data: { bookmarkCount: { decrement: 1 } },
      });

      this.logger.debug(`Bookmark removed: ${materialId} by ${userId}`);

      this.eventEmitter.emit(ActivityEvent.ACTION, new ActivityEvent(
        userId, ActivityType.BOOKMARK, 'material', materialId,
      ));

      return { bookmarked: false };
    }

    await this.prisma.materialBookmark.create({
      data: { materialId, userId },
    });

    await this.prisma.material.update({
      where: { id: materialId },
      data: { bookmarkCount: { increment: 1 } },
    });

    this.logger.debug(`Bookmark added: ${materialId} by ${userId}`);

    this.eventEmitter.emit(MaterialBookmarkedEvent.ACTION, new MaterialBookmarkedEvent(userId, materialId));
    this.eventEmitter.emit(ActivityEvent.ACTION, new ActivityEvent(
      userId, ActivityType.BOOKMARK, 'material', materialId,
    ));

    return { bookmarked: true };
  }

  async check(userId: string, materialId: string) {
    const bookmark = await this.prisma.materialBookmark.findUnique({
      where: { materialId_userId: { materialId, userId } },
    });

    return { bookmarked: !!bookmark };
  }
}
