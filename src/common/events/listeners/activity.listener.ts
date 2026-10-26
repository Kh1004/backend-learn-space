import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ActivityEvent } from '../index';

@Injectable()
export class ActivityListener {
  private readonly logger = new Logger(ActivityListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('activity')
  async handleActivity(event: ActivityEvent) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: event.userId,
          action: event.activityType,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          metadata: (event.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      this.logger.debug(
        `Activity logged: ${event.activityType} on ${event.resourceType}:${event.resourceId}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to log activity',
        (error as Error).stack,
      );
    }
  }
}
