import { Controller, Get, HttpException, HttpStatus, Req, Res, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'

import { Ip } from '~/common/decorators/http.decorator'
import { Public } from '~/modules/auth/decorators/public.decorator'

import { AuthService } from '../auth.service'

@ApiTags('Auth - OAuth')
@Controller('auth')
export class OAuthController {
  constructor(private authService: AuthService) {}

  private isGoogleEnabled(): boolean {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  }

  private isAppleEnabled(): boolean {
    return !!(
      process.env.APPLE_CLIENT_ID
      && process.env.APPLE_TEAM_ID
      && process.env.APPLE_KEY_ID
      && process.env.APPLE_PRIVATE_KEY
    )
  }

  @ApiOperation({ summary: 'Google OAuth Login' })
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    if (!this.isGoogleEnabled()) {
      throw new HttpException('Google OAuth is not configured', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  @ApiOperation({ summary: 'Google OAuth Callback' })
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Ip() ip: string,
  ) {
    const user = req.user as any
    const ua = req.headers['user-agent'] || ''

    const result = await this.authService.loginWithOAuth(user, ip, ua)

    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${result.accessToken}&isNewUser=${result.isNewUser}`
    return res.redirect(redirectUrl)
  }

  @ApiOperation({ summary: 'Apple OAuth Login' })
  @Public()
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  async appleAuth() {
    if (!this.isAppleEnabled()) {
      throw new HttpException('Apple OAuth is not configured', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  @ApiOperation({ summary: 'Apple OAuth Callback' })
  @Public()
  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Ip() ip: string,
  ) {
    const user = req.user as any
    const ua = req.headers['user-agent'] || ''

    const result = await this.authService.loginWithOAuth(user, ip, ua)

    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${result.accessToken}&isNewUser=${result.isNewUser}`
    return res.redirect(redirectUrl)
  }
}
