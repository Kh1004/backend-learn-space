import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ThumbnailJobData,
  AnalyticsJobData,
  EmailJobData,
} from './processors';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('thumbnail-generation')
    private readonly thumbnailQueue: Queue<ThumbnailJobData>,
    @InjectQueue('analytics-aggregation')
    private readonly analyticsQueue: Queue<AnalyticsJobData>,
    @InjectQueue('email-notification')
    private readonly emailQueue: Queue<EmailJobData>,
  ) {}

  async addThumbnailJob(data: ThumbnailJobData) {
    this.logger.log(`Adding thumbnail job for material: ${data.materialId}`);
    return this.thumbnailQueue.add('generate', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async addAnalyticsJob(data: AnalyticsJobData) {
    this.logger.log(`Adding analytics aggregation job: ${data.type}`);
    return this.analyticsQueue.add('aggregate', data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async addEmailJob(data: EmailJobData) {
    this.logger.log(`Adding email job to: ${data.to}`);
    return this.emailQueue.add('send', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  async getQueueStats() {
    const [thumbnailCounts, analyticsCounts, emailCounts] = await Promise.all([
      this.thumbnailQueue.getJobCounts(),
      this.analyticsQueue.getJobCounts(),
      this.emailQueue.getJobCounts(),
    ]);

    return {
      thumbnail: thumbnailCounts,
      analytics: analyticsCounts,
      email: emailCounts,
    };
  }
}
