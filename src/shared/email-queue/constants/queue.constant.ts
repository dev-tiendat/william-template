export const EMAIL_QUEUE_NAME = 'shared:email'
export const EMAIL_QUEUE_PREFIX = 'shared:email'

export enum EmailJobType {
  // Auth related
  SEND_OTP = 'send-otp',
  SEND_VERIFICATION = 'send-verification',
  SEND_WELCOME = 'send-welcome',

  // Generic
  SEND_GENERIC = 'send-generic',
  SEND_HTML = 'send-html',
  SEND_TEMPLATE = 'send-template',

  // Notifications
  SEND_NOTIFICATION = 'send-notification',
  SEND_ALERT = 'send-alert',

  // Bulk
  SEND_BULK = 'send-bulk',
}

export interface BaseEmailJobData {
  type: EmailJobType
  to: string | string[]
}

export interface SendOtpJobData extends BaseEmailJobData {
  type: EmailJobType.SEND_OTP
  to: string
  otp: string
  template?: string
  context?: Record<string, any>
}

export interface SendVerificationJobData extends BaseEmailJobData {
  type: EmailJobType.SEND_VERIFICATION
  to: string
  code: string
  template?: string
  context?: Record<string, any>
}

export interface SendWelcomeJobData extends BaseEmailJobData {
  type: EmailJobType.SEND_WELCOME
  to: string
  name: string
  template?: string
  context?: Record<string, any>
}

export interface SendGenericJobData extends BaseEmailJobData {
  type: EmailJobType.SEND_GENERIC
  to: string
  subject: string
  text?: string
  html?: string
}

export interface SendTemplateJobData extends BaseEmailJobData {
  type: EmailJobType.SEND_TEMPLATE
  to: string
  subject: string
  template: string
  context: Record<string, any>
}

export interface SendNotificationJobData extends BaseEmailJobData {
  type: EmailJobType.SEND_NOTIFICATION
  to: string
  title: string
  message: string
  link?: string
}

export interface SendBulkJobData extends BaseEmailJobData {
  type: EmailJobType.SEND_BULK
  to: string[]
  subject: string
  template: string
  context: Record<string, any>
}

export type EmailJobData =
  | SendOtpJobData
  | SendVerificationJobData
  | SendWelcomeJobData
  | SendGenericJobData
  | SendTemplateJobData
  | SendNotificationJobData
  | SendBulkJobData
