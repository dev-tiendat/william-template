import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ConfigKeyPaths, ISecurityConfig } from '~/config'
import { isDev } from '~/global/env'

import { LogModule } from '../system/log/log.module'
import { MenuModule } from '../system/menu/menu.module'
import { RoleModule } from '../system/role/role.module'
import { UserModule } from '../user/user.module'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AccountController } from './controllers/account.controller'
import { CaptchaController } from './controllers/captcha.controller'
import { EmailController } from './controllers/email.controller'
import { ForgotPasswordController } from './controllers/forgot-password.controller'
import { OAuthController } from './controllers/oauth.controller'
import { AccessTokenEntity } from './entities/access-token.entity'
import { OAuthProviderEntity } from './entities/oauth-provider.entity'
import { PasswordResetOtpEntity } from './entities/password-reset-otp.entity'
import { RefreshTokenEntity } from './entities/refresh-token.entity'
import { CaptchaService } from './services/captcha.service'
import { OAuthService } from './services/oauth.service'
import { PasswordResetService } from './services/password-reset.service'
import { TokenService } from './services/token.service'
import { AppleStrategy } from './strategies/apple.strategy'
import { GoogleStrategy } from './strategies/google.strategy'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'

const controllers = [
  AuthController,
  AccountController,
  CaptchaController,
  EmailController,
  OAuthController,
  ForgotPasswordController,
]
const providers = [
  AuthService,
  TokenService,
  CaptchaService,
  OAuthService,
  PasswordResetService,
]

// Always register all strategies
// OAuth strategies will handle missing credentials gracefully
// Controller will check if OAuth is enabled before allowing requests
const strategies: any[] = [
  LocalStrategy,
  JwtStrategy,
  GoogleStrategy,
  AppleStrategy,
]

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccessTokenEntity,
      RefreshTokenEntity,
      OAuthProviderEntity,
      PasswordResetOtpEntity,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        const { jwtSecret, jwtExprire }
          = configService.get<ISecurityConfig>('security')

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: `${jwtExprire}s`,
          },
          ignoreExpiration: isDev,
        }
      },
      inject: [ConfigService],
    }),
    UserModule,
    RoleModule,
    MenuModule,
    LogModule,
  ],
  controllers: [...controllers],
  providers: [...providers, ...strategies],
  exports: [TypeOrmModule, JwtModule, ...providers],
})
export class AuthModule { }
