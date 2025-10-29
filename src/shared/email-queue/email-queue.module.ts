import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { ConfigKeyPaths, IRedisConfig } from '~/config'

import { MailerModule } from '../mailer/mailer.module'

import { EMAIL_QUEUE_NAME } from './constants/queue.constant'
import { EmailQueueService } from './email-queue.service'
import { EmailQueueProcessor } from './processors/email.processor'

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: EMAIL_QUEUE_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
        redis: configService.get<IRedisConfig>('redis'),
        prefix: 'shared:email',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
    MailerModule,
  ],
  providers: [EmailQueueService, EmailQueueProcessor],
  exports: [EmailQueueService, BullModule],
})
export class EmailQueueModule {}
