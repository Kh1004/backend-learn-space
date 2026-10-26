import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

@Processor('email-notification')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<EmailJobData>): Promise<{ sent: boolean }> {
    this.logger.log(`Processing email to: ${job.data.to}`);

    try {
      await job.updateProgress(10);

      const { to, subject, template, data } = job.data;

      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      // For now, simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 100));
      await job.updateProgress(50);

      this.logger.log(`Email sent to ${to} with template: ${template}`);
      await job.updateProgress(100);

      return { sent: true };
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw error;
    }
  }
}
