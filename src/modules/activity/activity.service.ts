import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../../common/dtos';
import {
  buildPaginatedResult,
  buildPrismaQueryOptions,
} from '../../common/utils';
import { buildSoftDeleteFilter } from '../../database/helpers';
import { CreateActivityDto, ActivityQueryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  private readonly activitySelect = {
    id: true,
    action: true,
    resourceType: true,
    resourceId: true,
    metadata: true,
    ip: true,
    createdAt: true,
    user: {
      select: { id: true, firstName: true, lastName: true },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ActivityQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where: Prisma.ActivityLogWhereInput = {
      ...softDeleteFilter,
      ...(query.action && { action: query.action }),
      ...(query.resourceType && { resourceType: query.resourceType }),
      ...(query.userId && { userId: query.userId }),
    };

    const [activities, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        select: this.activitySelect,
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return buildPaginatedResult(activities, query, total);
  }

  async findOne(id: string) {
    const activity = await this.prisma.activityLog.findFirst({
      where: { id },
      select: this.activitySelect,
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async findByUser(userId: string, query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where = { userId, ...softDeleteFilter };

    const [activities, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        select: this.activitySelect,
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return buildPaginatedResult(activities, query, total);
  }

  async log(
    dto: CreateActivityDto,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const activity = await this.prisma.activityLog.create({
      data: {
        userId,
        action: dto.action,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        metadata: dto.metadata as Prisma.InputJsonValue,
        ip,
        userAgent,
      },
      select: this.activitySelect,
    });

    this.logger.debug(
      `Activity logged: ${dto.action} on ${dto.resourceType}:${dto.resourceId}`,
    );
    return activity;
  }
}
