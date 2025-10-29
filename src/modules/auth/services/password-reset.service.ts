import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import dayjs from 'dayjs'
import { LessThan, MoreThan, Repository } from 'typeorm'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { EmailQueueService } from '~/shared/email-queue/email-queue.service'
import { randomValue } from '~/utils'

import { PasswordResetOtpEntity } from '../entities/password-reset-otp.entity'

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetOtpEntity)
    private otpRepository: Repository<PasswordResetOtpEntity>,
    private emailQueueService: EmailQueueService,
  ) { }

  private generateOtp(): string {
    return randomValue(5, '0123456789')
  }

  async requestPasswordReset(email: string, ipAddress: string, userAgent: string): Promise<void> {
    const oneHourAgo = dayjs().subtract(1, 'hour').toDate()
    const recentOtps = await this.otpRepository.count({
      where: {
        email,
        createdAt: MoreThan(oneHourAgo),
      },
    })

    if (recentOtps >= 3) {
      throw new BusinessException(ErrorEnum.TOO_MANY_OTP_REQUESTS)
    }

    await this.otpRepository.update(
      {
        email,
        isUsed: false,
      },
      {
        isUsed: true,
        usedAt: new Date(),
      },
    )

    const otp = this.generateOtp()
    const expiresAt = dayjs().add(10, 'minute').toDate()

    const otpEntity = this.otpRepository.create({
      email,
      otp,
      expiresAt,
      ipAddress,
      userAgent,
      isUsed: false,
      attempts: 0,
    })

    await this.otpRepository.save(otpEntity)

    await this.emailQueueService.queuePasswordResetOtp(email, otp)
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const otpEntity = await this.otpRepository.findOne({
      where: {
        email,
        otp,
        isUsed: false,
      },
      order: {
        createdAt: 'DESC',
      },
    })

    if (!otpEntity) {
      throw new BusinessException(ErrorEnum.INVALID_OTP)
    }

    if (dayjs().isAfter(dayjs(otpEntity.expiresAt))) {
      throw new BusinessException(ErrorEnum.OTP_EXPIRED)
    }

    if (otpEntity.attempts >= 5) {
      throw new BusinessException(ErrorEnum.TOO_MANY_OTP_ATTEMPTS)
    }

    otpEntity.attempts += 1
    await this.otpRepository.save(otpEntity)

    otpEntity.isUsed = true
    otpEntity.usedAt = new Date()
    await this.otpRepository.save(otpEntity)

    return true
  }

  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    })

    return result.affected || 0
  }

  async getOtpStats(email: string): Promise<{
    totalRequests: number
    recentRequests: number
    lastRequestAt: Date | null
  }> {
    const total = await this.otpRepository.count({ where: { email } })
    const oneHourAgo = dayjs().subtract(1, 'hour').toDate()
    const recent = await this.otpRepository.count({
      where: {
        email,
        createdAt: MoreThan(oneHourAgo),
      },
    })

    const lastOtp = await this.otpRepository.findOne({
      where: { email },
      order: { createdAt: 'DESC' },
    })

    return {
      totalRequests: total,
      recentRequests: recent,
      lastRequestAt: lastOtp?.createdAt || null,
    }
  }
}
