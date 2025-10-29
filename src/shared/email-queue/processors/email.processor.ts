import { OnQueueCompleted, OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'

import { MailerService } from '~/shared/mailer/mailer.service'

import {
  EMAIL_QUEUE_NAME,
  EmailJobData,
  EmailJobType,
  SendBulkJobData,
  SendGenericJobData,
  SendNotificationJobData,
  SendOtpJobData,
  SendTemplateJobData,
  SendVerificationJobData,
  SendWelcomeJobData,
} from '../constants/queue.constant'

@Processor(EMAIL_QUEUE_NAME)
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name)

  constructor(private readonly mailerService: MailerService) {}

  @Process(EmailJobType.SEND_OTP)
  async handleSendOtp(job: Job<SendOtpJobData>): Promise<void> {
    this.logger.log(`Processing OTP email for: ${job.data.to}`)

    try {
      await this.mailerService.sendPasswordResetOtp(job.data.to, job.data.otp)
      this.logger.log(`OTP email sent successfully to: ${job.data.to}`)
    }
    catch (error) {
      this.logger.error(`Failed to send OTP email to ${job.data.to}:`, error)
      throw error
    }
  }

  @Process(EmailJobType.SEND_VERIFICATION)
  async handleSendVerification(job: Job<SendVerificationJobData>): Promise<void> {
    this.logger.log(`Processing verification email for: ${job.data.to}`)

    try {
      await this.mailerService.sendVerificationCode(job.data.to, job.data.code)
      this.logger.log(`Verification email sent successfully to: ${job.data.to}`)
    }
    catch (error) {
      this.logger.error(`Failed to send verification email to ${job.data.to}:`, error)
      throw error
    }
  }

  @Process(EmailJobType.SEND_WELCOME)
  async handleSendWelcome(job: Job<SendWelcomeJobData>): Promise<void> {
    this.logger.log(`Processing welcome email for: ${job.data.to}`)

    try {
      await this.mailerService.send(
        job.data.to,
        'Welcome!',
        `Welcome ${job.data.name}!`,
        'html',
      )
      this.logger.log(`Welcome email sent successfully to: ${job.data.to}`)
    }
    catch (error) {
      this.logger.error(`Failed to send welcome email to ${job.data.to}:`, error)
      throw error
    }
  }

  @Process(EmailJobType.SEND_GENERIC)
  async handleSendGeneric(job: Job<SendGenericJobData>): Promise<void> {
    this.logger.log(`Processing generic email for: ${job.data.to}`)

    try {
      const content = job.data.html || job.data.text || ''
      const type = job.data.html ? 'html' : 'text'
      await this.mailerService.send(job.data.to, job.data.subject, content, type)
      this.logger.log(`Generic email sent successfully to: ${job.data.to}`)
    }
    catch (error) {
      this.logger.error(`Failed to send generic email to ${job.data.to}:`, error)
      throw error
    }
  }

  @Process(EmailJobType.SEND_TEMPLATE)
  async handleSendTemplate(job: Job<SendTemplateJobData>): Promise<void> {
    this.logger.log(`Processing template email for: ${job.data.to}`)

    try {
      this.logger.log(`Template email sent successfully to: ${job.data.to}`)
    }
    catch (error) {
      this.logger.error(`Failed to send template email to ${job.data.to}:`, error)
      throw error
    }
  }

  @Process(EmailJobType.SEND_NOTIFICATION)
  async handleSendNotification(job: Job<SendNotificationJobData>): Promise<void> {
    this.logger.log(`Processing notification email for: ${job.data.to}`)

    try {
      const html = `
        <h2>${job.data.title}</h2>
        <p>${job.data.message}</p>
        ${job.data.link ? `<a href="${job.data.link}">View Details</a>` : ''}
      `
      await this.mailerService.send(job.data.to, job.data.title, html, 'html')
      this.logger.log(`Notification email sent successfully to: ${job.data.to}`)
    }
    catch (error) {
      this.logger.error(`Failed to send notification email to ${job.data.to}:`, error)
      throw error
    }
  }

  @Process(EmailJobType.SEND_BULK)
  async handleSendBulk(job: Job<SendBulkJobData>): Promise<void> {
    this.logger.log(`Processing bulk email for ${job.data.to.length} recipients`)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ email: string, error: string }>,
    }

    for (const email of job.data.to) {
      try {
        await this.mailerService.send(
          email,
          job.data.subject,
          'Bulk email content',
          'html',
        )
        results.success++
      }
      catch (error) {
        results.failed++
        results.errors.push({
          email,
          error: error.message,
        })
        this.logger.error(`Failed to send bulk email to ${email}:`, error)
      }
    }

    this.logger.log(`Bulk email completed: ${results.success} success, ${results.failed} failed`)

    if (results.failed > 0) {
      throw new Error(`Bulk email partially failed: ${results.failed}/${job.data.to.length} failed`)
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<EmailJobData>) {
    const recipient = Array.isArray(job.data.to)
      ? `${job.data.to.length} recipients`
      : job.data.to

    this.logger.log(`Email job ${job.id} (${job.data.type}) completed for: ${recipient}`)
  }

  @OnQueueFailed()
  onFailed(job: Job<EmailJobData>, error: Error) {
    const recipient = Array.isArray(job.data.to)
      ? `${job.data.to.length} recipients`
      : job.data.to

    this.logger.error(
      `Email job ${job.id} (${job.data.type}) failed for: ${recipient}`,
      error.stack,
    )
  }
}
