import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../../common/dtos';
import {
  buildPaginatedResult,
  buildPrismaQueryOptions,
} from '../../common/utils';
import { ActivityEvent, ActivityType } from '../../common/events';

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  private readonly userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async toggle(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: followingId, deletedAt: null },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      await this.prisma.userFollow.delete({
        where: { id: existing.id },
      });

      this.logger.debug(`Unfollowed: ${followerId} → ${followingId}`);

      this.eventEmitter.emit(ActivityEvent.ACTION, new ActivityEvent(
        followerId, ActivityType.FOLLOW, 'user', followingId,
      ));

      return { following: false };
    }

    await this.prisma.userFollow.create({
      data: { followerId, followingId },
    });

    this.logger.debug(`Followed: ${followerId} → ${followingId}`);

    this.eventEmitter.emit(ActivityEvent.ACTION, new ActivityEvent(
      followerId, ActivityType.FOLLOW, 'user', followingId,
    ));

    return { following: true };
  }

  async getFollowers(userId: string, query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);

    const where = { followingId: userId };

    const [followers, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          follower: { select: this.userSelect },
        },
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      this.prisma.userFollow.count({ where }),
    ]);

    return buildPaginatedResult(followers, query, total);
  }

  async getFollowing(userId: string, query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);

    const where = { followerId: userId };

    const [following, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          following: { select: this.userSelect },
        },
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      this.prisma.userFollow.count({ where }),
    ]);

    return buildPaginatedResult(following, query, total);
  }

  async check(followerId: string, followingId: string) {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    return { following: !!follow };
  }
}
