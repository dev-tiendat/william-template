import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity } from 'typeorm'

import { CommonEntity } from '~/common/entity/common.entity'

@Entity({ name: 'sys_captcha_log' })
export class CaptchaLogEntity extends CommonEntity {
  @Column({ name: 'user_id', nullable: true })
  @ApiProperty({ description: 'User ID' })
  userId: number

  @Column({ nullable: true })
  @ApiProperty({ description: 'Account' })
  account: string

  @Column({ nullable: true })
  @ApiProperty({ description: 'Verification code' })
  code: string

  @Column({ nullable: true })
  @ApiProperty({ description: 'Captcha provider' })
  provider: 'sms' | 'email'
}
