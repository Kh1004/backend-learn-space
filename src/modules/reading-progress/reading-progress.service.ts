import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../../common/dtos';
import {
  buildPaginatedResult,
  buildPrismaQueryOptions,
} from '../../common/utils';
import { UpdateProgressDto } from './dto';

@Injectable()
export class ReadingProgressService {
  private readonly logger = new Logger(ReadingProgressService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string, query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);

    const where = { userId };

    const [progress, total] = await Promise.all([
      this.prisma.readingProgress.findMany({
        where,
        select: {
          id: true,
          currentPage: true,
          progressPercent: true,
          readingTime: true,
          isCompleted: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          material: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              readingTime: true,
              author: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
        skip,
        take,
        orderBy: orderBy || { updatedAt: 'desc' },
      }),
      this.prisma.readingProgress.count({ where }),
    ]);

    return buildPaginatedResult(progress, query, total);
  }

  async findByMaterial(userId: string, materialId: string) {
    const progress = await this.prisma.readingProgress.findUnique({
      where: { materialId_userId: { materialId, userId } },
      select: {
        id: true,
        currentPage: true,
        progressPercent: true,
        readingTime: true,
        isCompleted: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        material: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            readingTime: true,
          },
        },
      },
    });

    if (!progress) {
      return null;
    }

    return progress;
  }

  async upsert(userId: string, dto: UpdateProgressDto) {
    const material = await this.prisma.material.findFirst({
      where: { id: dto.materialId, deletedAt: null },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const isCompleted = dto.isCompleted ?? dto.progressPercent >= 100;

    const progress = await this.prisma.readingProgress.upsert({
      where: {
        materialId_userId: {
          materialId: dto.materialId,
          userId,
        },
      },
      create: {
        materialId: dto.materialId,
        userId,
        currentPage: dto.currentPage,
        progressPercent: dto.progressPercent,
        readingTime: dto.readingTime ?? 0,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        currentPage: dto.currentPage,
        progressPercent: dto.progressPercent,
        readingTime: dto.readingTime,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
      },
      select: {
        id: true,
        currentPage: true,
        progressPercent: true,
        readingTime: true,
        isCompleted: true,
        completedAt: true,
        updatedAt: true,
      },
    });

    this.logger.debug(
      `Progress updated: material=${dto.materialId} user=${userId} ${dto.progressPercent}%`,
    );
    return progress;
  }

  async remove(userId: string, materialId: string) {
    const existing = await this.prisma.readingProgress.findUnique({
      where: { materialId_userId: { materialId, userId } },
    });

    if (!existing) {
      throw new NotFoundException('Reading progress not found');
    }

    await this.prisma.readingProgress.delete({
      where: { id: existing.id },
    });

    this.logger.debug(`Progress removed: material=${materialId} user=${userId}`);
    return { message: 'Reading progress deleted successfully' };
  }
}
