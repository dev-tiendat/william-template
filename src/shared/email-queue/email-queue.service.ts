import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { JobOptions, Queue } from 'bull'

import {
  EMAIL_QUEUE_NAME,
  EmailJobType,
  SendBulkJobData,
  SendGenericJobData,
  SendNotificationJobData,
  SendOtpJobData,
  SendTemplateJobData,
  SendVerificationJobData,
  SendWelcomeJobData,
} from './constants/queue.constant'

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name)

  constructor(
    @InjectQueue(EMAIL_QUEUE_NAME)
    private readonly emailQueue: Queue,
  ) { }

  /**
   * Default job options for email jobs
   */
  private getDefaultJobOptions(): JobOptions {
    return {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  }

  /**
   * Queue password reset OTP email
   */
  async queuePasswordResetOtp(
    email: string,
    otp: string,
    options?: JobOptions,
  ): Promise<void> {
    const jobData: SendOtpJobData = {
      type: EmailJobType.SEND_OTP,
      to: email,
      otp,
    }

    await this.emailQueue.add(
      EmailJobType.SEND_OTP,
      jobData,
      { ...this.getDefaultJobOptions(), ...options },
    )

    this.logger.log(`Queued password reset OTP email for: ${email}`)
  }

  /**
   * Queue verification code email
   */
  async queueVerificationCode(
    email: string,
    code: string,
    options?: JobOptions,
  ): Promise<void> {
    const jobData: SendVerificationJobData = {
      type: EmailJobType.SEND_VERIFICATION,
      to: email,
      code,
    }

    await this.emailQueue.add(
      EmailJobType.SEND_VERIFICATION,
      jobData,
      { ...this.getDefaultJobOptions(), ...options },
    )

    this.logger.log(`Queued verification code email for: ${email}`)
  }

  /**
   * Queue welcome email
   */
  async queueWelcomeEmail(
    email: string,
    name: string,
    options?: JobOptions,
  ): Promise<void> {
    const jobData: SendWelcomeJobData = {
      type: EmailJobType.SEND_WELCOME,
      to: email,
      name,
    }

    await this.emailQueue.add(
      EmailJobType.SEND_WELCOME,
      jobData,
      { ...this.getDefaultJobOptions(), ...options },
    )

    this.logger.log(`Queued welcome email for: ${email}`)
  }

  /**
   * Queue generic text or HTML email
   */
  async queueGenericEmail(
    to: string,
    subject: string,
    content: { text?: string, html?: string },
    options?: JobOptions,
  ): Promise<void> {
    const jobData: SendGenericJobData = {
      type: EmailJobType.SEND_GENERIC,
      to,
      subject,
      text: content.text,
      html: content.html,
    }

    await this.emailQueue.add(
      EmailJobType.SEND_GENERIC,
      jobData,
      { ...this.getDefaultJobOptions(), ...options },
    )

    this.logger.log(`Queued generic email for: ${to}`)
  }

  /**
   * Queue template-based email
   */
  async queueTemplateEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
    options?: JobOptions,
  ): Promise<void> {
    const jobData: SendTemplateJobData = {
      type: EmailJobType.SEND_TEMPLATE,
      to,
      subject,
      template,
      context,
    }

    await this.emailQueue.add(
      EmailJobType.SEND_TEMPLATE,
      jobData,
      { ...this.getDefaultJobOptions(), ...options },
    )

    this.logger.log(`Queued template email for: ${to}`)
  }

  /**
   * Queue notification email
   */
  async queueNotificationEmail(
    to: string,
    title: string,
    message: string,
    link?: string,
    options?: JobOptions,
  ): Promise<void> {
    const jobData: SendNotificationJobData = {
      type: EmailJobType.SEND_NOTIFICATION,
      to,
      title,
      message,
      link,
    }

    await this.emailQueue.add(
      EmailJobType.SEND_NOTIFICATION,
      jobData,
      { ...this.getDefaultJobOptions(), ...options },
    )

    this.logger.log(`Queued notification email for: ${to}`)
  }

  /**
   * Queue bulk emails (same content to multiple recipients)
   */
  async queueBulkEmail(
    recipients: string[],
    subject: string,
    template: string,
    context: Record<string, any>,
    options?: JobOptions,
  ): Promise<void> {
    const jobData: SendBulkJobData = {
      type: EmailJobType.SEND_BULK,
      to: recipients,
      subject,
      template,
      context,
    }

    await this.emailQueue.add(
      EmailJobType.SEND_BULK,
      jobData,
      {
        ...this.getDefaultJobOptions(),
        timeout: 300000, // 5 minutes for bulk emails
        ...options,
      },
    )

    this.logger.log(`Queued bulk email for ${recipients.length} recipients`)
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return {
      counts: await this.emailQueue.getJobCounts(),
      waiting: await this.emailQueue.getWaitingCount(),
      active: await this.emailQueue.getActiveCount(),
      completed: await this.emailQueue.getCompletedCount(),
      failed: await this.emailQueue.getFailedCount(),
      delayed: await this.emailQueue.getDelayedCount(),
      paused: await this.emailQueue.getPausedCount(),
    }
  }

  /**
   * Get failed jobs for debugging
   */
  async getFailedJobs(start = 0, end = 10) {
    return this.emailQueue.getFailed(start, end)
  }

  /**
   * Retry failed job
   */
  async retryFailedJob(jobId: string) {
    const job = await this.emailQueue.getJob(jobId)
    if (job) {
      await job.retry()
      this.logger.log(`Retrying failed job: ${jobId}`)
    }
  }

  /**
   * Clean old completed jobs
   */
  async cleanCompletedJobs(grace = 3600000) {
    // Clean jobs completed more than grace period ago (default: 1 hour)
    await this.emailQueue.clean(grace, 'completed')
    this.logger.log(`Cleaned completed jobs older than ${grace}ms`)
  }

  /**
   * Clean old failed jobs
   */
  async cleanFailedJobs(grace = 86400000) {
    // Clean jobs failed more than grace period ago (default: 24 hours)
    await this.emailQueue.clean(grace, 'failed')
    this.logger.log(`Cleaned failed jobs older than ${grace}ms`)
  }
}
