import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'

import { ConfigKeyPaths } from '~/config'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name)

  constructor(private configService: ConfigService<ConfigKeyPaths>) {
    const clientID = configService.get('oauth.google.clientID', { infer: true }) || 'dummy-client-id'
    const clientSecret = configService.get('oauth.google.clientSecret', { infer: true }) || 'dummy-secret'
    const callbackURL = configService.get('oauth.google.callbackURL', { infer: true }) || 'http://localhost:3000/auth/google/callback'

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    })

    // Log warning if credentials are not configured
    if (clientID === 'dummy-client-id' || clientSecret === 'dummy-secret') {
      this.logger.warn('Google OAuth credentials not configured. Google login will not work.')
    }
    else {
      this.logger.log('Google OAuth strategy initialized successfully')
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile

    const user = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      avatar: photos[0].value,
      accessToken,
      refreshToken,
    }

    done(null, user)
  }
}
