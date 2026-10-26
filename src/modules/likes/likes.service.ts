import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../../common/dtos';
import {
  buildPaginatedResult,
  buildPrismaQueryOptions,
} from '../../common/utils';
import { MaterialLikedEvent, ActivityEvent, ActivityType } from '../../common/events';

@Injectable()
export class LikesService {
  private readonly logger = new Logger(LikesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findByUser(userId: string, query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);

    const where = { userId };

    const [likes, total] = await Promise.all([
      this.prisma.materialLike.findMany({
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
              likeCount: true,
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
      this.prisma.materialLike.count({ where }),
    ]);

    return buildPaginatedResult(likes, query, total);
  }

  async findByMaterial(materialId: string, query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);

    const where = { materialId };

    const [likes, total] = await Promise.all([
      this.prisma.materialLike.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      this.prisma.materialLike.count({ where }),
    ]);

    return buildPaginatedResult(likes, query, total);
  }

  async toggle(userId: string, materialId: string) {
    const material = await this.prisma.material.findFirst({
      where: { id: materialId, deletedAt: null },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const existing = await this.prisma.materialLike.findUnique({
      where: { materialId_userId: { materialId, userId } },
    });

    if (existing) {
      await this.prisma.materialLike.delete({
        where: { id: existing.id },
      });

      await this.prisma.material.update({
        where: { id: materialId },
        data: { likeCount: { decrement: 1 } },
      });

      this.logger.debug(`Like removed: ${materialId} by ${userId}`);

      this.eventEmitter.emit(ActivityEvent.ACTION, new ActivityEvent(
        userId, ActivityType.LIKE, 'material', materialId,
      ));

      return { liked: false };
    }

    await this.prisma.materialLike.create({
      data: { materialId, userId },
    });

    await this.prisma.material.update({
      where: { id: materialId },
      data: { likeCount: { increment: 1 } },
    });

    this.logger.debug(`Like added: ${materialId} by ${userId}`);

    this.eventEmitter.emit(MaterialLikedEvent.ACTION, new MaterialLikedEvent(userId, materialId));
    this.eventEmitter.emit(ActivityEvent.ACTION, new ActivityEvent(
      userId, ActivityType.LIKE, 'material', materialId,
    ));

    return { liked: true };
  }

  async check(userId: string, materialId: string) {
    const like = await this.prisma.materialLike.findUnique({
      where: { materialId_userId: { materialId, userId } },
    });

    return { liked: !!like };
  }
}
