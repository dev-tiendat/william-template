import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-apple'

import { ConfigKeyPaths } from '~/config'

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  private readonly logger = new Logger(AppleStrategy.name)

  constructor(private configService: ConfigService<ConfigKeyPaths>) {
    const clientID = configService.get('oauth.apple.clientID', { infer: true }) || 'dummy-client-id'
    const teamID = configService.get('oauth.apple.teamID', { infer: true }) || 'dummy-team-id'
    const keyID = configService.get('oauth.apple.keyID', { infer: true }) || 'dummy-key-id'
    const privateKeyString = configService.get('oauth.apple.privateKey', { infer: true }) || 'dummy-key'
    const callbackURL = configService.get('oauth.apple.callbackURL', { infer: true }) || 'http://localhost:3000/auth/apple/callback'

    super({
      clientID,
      teamID,
      keyID,
      privateKeyString,
      callbackURL,
      scope: ['email', 'name'],
      passReqToCallback: false,
    })

    // Log warning if credentials are not configured
    if (clientID === 'dummy-client-id' || teamID === 'dummy-team-id') {
      this.logger.warn('Apple OAuth credentials not configured. Apple login will not work.')
    }
    else {
      this.logger.log('Apple OAuth strategy initialized successfully')
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { sub, email } = idToken

    const user = {
      provider: 'apple',
      providerId: sub,
      email: email || profile.email,
      name: profile.name
        ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim()
        : email?.split('@')[0] || 'Apple User',
      avatar: null, // Apple doesn't provide avatar
      accessToken,
      refreshToken,
    }

    done(null, user)
  }
}
