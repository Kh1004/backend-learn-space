import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';

export interface AnalyticsJobData {
  type: 'daily' | 'weekly' | 'monthly';
  date?: string;
}

@Processor('analytics-aggregation')
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<AnalyticsJobData>): Promise<{ aggregated: boolean }> {
    this.logger.log(`Processing analytics aggregation: ${job.data.type}`);

    try {
      await job.updateProgress(10);

      const { type, date } = job.data;
      const targetDate = date ? new Date(date) : new Date();

      await job.updateProgress(30);

      // Aggregate material views
      const viewCount = await this.prisma.materialView.count({
        where: {
          createdAt: {
            gte: this.getStartOfPeriod(targetDate, type),
            lt: this.getEndOfPeriod(targetDate, type),
          },
        },
      });

      await job.updateProgress(60);

      // Aggregate new users
      const newUsers = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: this.getStartOfPeriod(targetDate, type),
            lt: this.getEndOfPeriod(targetDate, type),
          },
        },
      });

      await job.updateProgress(90);

      // TODO: Store aggregated results in a separate table or cache
      this.logger.log(
        `Analytics aggregated: ${viewCount} views, ${newUsers} new users for ${type}`,
      );

      await job.updateProgress(100);

      return { aggregated: true };
    } catch (error) {
      this.logger.error(`Analytics aggregation failed: ${error.message}`);
      throw error;
    }
  }

  private getStartOfPeriod(date: Date, type: string): Date {
    const start = new Date(date);
    switch (type) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return start;
  }

  private getEndOfPeriod(date: Date, type: string): Date {
    const end = new Date(date);
    switch (type) {
      case 'daily':
        end.setDate(end.getDate() + 1);
        end.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        end.setDate(end.getDate() + 7);
        end.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        end.setDate(1);
        end.setHours(0, 0, 0, 0);
        break;
    }
    return end;
  }
}
