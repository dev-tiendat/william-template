import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'

import { Public } from '~/modules/auth/decorators/public.decorator'

import { AuthService } from '../auth.service'
import { MobileOAuthLoginDto } from '../dto/oauth-mobile.dto'

@ApiTags('Auth - OAuth')
@Controller('auth')
export class OAuthController {
  constructor(private authService: AuthService) { }

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
  ) {
    const user = req.user as any

    const result = await this.authService.loginWithOAuth(user)

    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${result.tokens.accessToken}&isNewUser=${result.isNewUser}`
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
  ) {
    const user = req.user as any

    const result = await this.authService.loginWithOAuth(user)

    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${result.tokens.accessToken}&isNewUser=${result.isNewUser}`
    return res.redirect(redirectUrl)
  }

  @ApiOperation({
    summary: 'Mobile OAuth Login (React Native)',
    description: 'Login or register using OAuth credentials from mobile app. The mobile app should handle OAuth flow with the provider (Google/Apple) and send the tokens to this endpoint.',
  })
  @ApiBody({ type: MobileOAuthLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            username: { type: 'string' },
            fullName: { type: 'string' },
            avatarUrl: { type: 'string' },
          },
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', description: 'JWT access token for API authentication' },
            refreshToken: { type: 'string', description: 'JWT refresh token' },
          },
        },
        isNewUser: { type: 'boolean', description: 'Whether this is a newly created user' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OAuth data or token verification failed',
  })
  @Public()
  @Post('mobile/oauth')
  async mobileOAuthLogin(
    @Body() oauthData: MobileOAuthLoginDto,
  ) {
    const oauthUser = {
      provider: oauthData.provider,
      providerId: oauthData.providerId,
      email: oauthData.email,
      name: oauthData.name,
      avatar: oauthData.avatar,
      accessToken: oauthData.accessToken,
      refreshToken: oauthData.refreshToken,
    }

    const result = await this.authService.loginWithOAuth(oauthUser)

    return result
  }
}
