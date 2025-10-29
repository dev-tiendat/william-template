import { ConfigType, registerAs } from '@nestjs/config'

import { env, envString } from '~/global/env'

export const oauthRegToken = 'oauth'

export const OAuthConfig = registerAs(oauthRegToken, () => ({
  google: {
    clientID: envString('GOOGLE_CLIENT_ID'),
    clientSecret: envString('GOOGLE_CLIENT_SECRET'),
    callbackURL: env('GOOGLE_CALLBACK_URL', 'http://localhost:3000/auth/google/callback'),
  },
  apple: {
    clientID: envString('APPLE_CLIENT_ID'),
    teamID: envString('APPLE_TEAM_ID'),
    keyID: envString('APPLE_KEY_ID'),
    privateKey: envString('APPLE_PRIVATE_KEY'),
    callbackURL: env('APPLE_CALLBACK_URL', 'http://localhost:3000/auth/apple/callback'),
  },
}))

export type IOAuthConfig = ConfigType<typeof OAuthConfig>
