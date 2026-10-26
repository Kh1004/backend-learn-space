import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  MaterialPublishedEvent,
  MaterialViewedEvent,
  MaterialDownloadedEvent,
  MaterialBookmarkedEvent,
  MaterialLikedEvent,
  UserCreatedEvent,
} from '../index';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('material.published')
  async handleMaterialPublished(event: MaterialPublishedEvent) {
    try {
      const followers = await this.prisma.userFollow.findMany({
        where: { followingId: event.userId },
        select: { followerId: true },
      });

      if (followers.length === 0) return;

      await this.prisma.notification.createMany({
        data: followers.map((f) => ({
          userId: f.followerId,
          type: 'MATERIAL_PUBLISHED',
          title: 'New material published',
          message: `A new material "${event.materialTitle}" has been published.`,
          data: {
            materialId: event.materialId,
            authorId: event.userId,
          } as unknown as Prisma.InputJsonValue,
        })),
      });

      this.logger.log(
        `Notifications sent to ${followers.length} followers for material: ${event.materialId}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send material published notifications',
        (error as Error).stack,
      );
    }
  }

  @OnEvent('material.viewed')
  async handleMaterialViewed(event: MaterialViewedEvent) {
    try {
      await this.prisma.material.update({
        where: { id: event.materialId },
        data: { viewCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(
        'Failed to increment view count',
        (error as Error).stack,
      );
    }
  }

  @OnEvent('material.downloaded')
  async handleMaterialDownloaded(event: MaterialDownloadedEvent) {
    try {
      await this.prisma.material.update({
        where: { id: event.materialId },
        data: { downloadCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(
        'Failed to increment download count',
        (error as Error).stack,
      );
    }
  }

  @OnEvent('material.bookmarked')
  async handleMaterialBookmarked(event: MaterialBookmarkedEvent) {
    try {
      await this.prisma.material.update({
        where: { id: event.materialId },
        data: { bookmarkCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(
        'Failed to increment bookmark count',
        (error as Error).stack,
      );
    }
  }

  @OnEvent('material.liked')
  async handleMaterialLiked(event: MaterialLikedEvent) {
    try {
      await this.prisma.material.update({
        where: { id: event.materialId },
        data: { likeCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(
        'Failed to increment like count',
        (error as Error).stack,
      );
    }
  }

  @OnEvent('user.created')
  async handleUserCreated(event: UserCreatedEvent) {
    try {
      await this.prisma.notification.create({
        data: {
          userId: event.userId,
          type: 'WELCOME',
          title: 'Welcome!',
          message: 'Welcome to the education platform. Start exploring!',
        },
      });

      this.logger.log(`Welcome notification sent to: ${event.userId}`);
    } catch (error) {
      this.logger.error(
        'Failed to send welcome notification',
        (error as Error).stack,
      );
    }
  }
}
