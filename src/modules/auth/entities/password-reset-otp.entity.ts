import { Column, Entity, Index } from 'typeorm'

import { CommonEntity } from '~/common/entity/common.entity'

@Entity({ name: 'sys_password_reset_otp' })
@Index(['email', 'otp'])
export class PasswordResetOtpEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 255 })
  @Index()
  email: string

  @Column({ type: 'varchar', length: 5 })
  otp: string

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed: boolean

  @Column({ name: 'used_at', type: 'datetime', nullable: true })
  usedAt: Date | null

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string

  @Column({ name: 'attempts', type: 'int', default: 0 })
  attempts: number
}
