import type { Request } from 'express'
import { Body, Controller, Post, Req } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'

import { Ip } from '~/common/decorators/http.decorator'
import { Public } from '~/modules/auth/decorators/public.decorator'

import { AuthService } from '../auth.service'
import {
  RequestPasswordResetDto,
  ResetPasswordWithOtpDto,
  VerifyOtpDto,
} from '../dto/forgot-password.dto'
import { PasswordResetService } from '../services/password-reset.service'

@ApiTags('Auth - Password Reset')
@Controller('auth/password-reset')
export class ForgotPasswordController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: 'Request password reset OTP' })
  @Public()
  @Post('request')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const userAgent = req.headers['user-agent'] || 'unknown'

    await this.passwordResetService.requestPasswordReset(dto.email, ip, userAgent)

    return {
      message: 'If the email exists, an OTP has been sent. Please check your inbox.',
    }
  }

  @ApiOperation({ summary: 'Verify OTP code' })
  @Public()
  @Post('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ message: string, valid: boolean }> {
    const isValid = await this.passwordResetService.verifyOtp(dto.email, dto.otp)

    return {
      message: 'OTP verified successfully',
      valid: isValid,
    }
  }

  @ApiOperation({ summary: 'Reset password with OTP' })
  @Public()
  @Post('reset')
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  async resetPasswordWithOtp(
    @Body() dto: ResetPasswordWithOtpDto,
  ): Promise<{ message: string }> {
    await this.passwordResetService.verifyOtp(dto.email, dto.otp)

    await this.authService.resetPassword(dto.email, dto.newPassword)

    return {
      message: 'Password has been reset successfully. You can now login with your new password.',
    }
  }
}
