import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import Redis from 'ioredis'
import { isEmpty, isNil } from 'lodash'
import { ExtractJwt } from 'passport-jwt'

import { InjectRedis } from '~/common/decorators/inject-redis.decorator'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { AppConfig, IAppConfig, RouterWhiteList } from '~/config'
import { ErrorEnum } from '~/constants/error-code.constant'
import { genTokenBlacklistKey } from '~/helper/genRedisKey'

import { AuthService } from '~/modules/auth/auth.service'

import { checkIsDemoMode } from '~/utils'

import { AuthStrategy, PUBLIC_KEY } from '../auth.constant'
import { TokenService } from '../services/token.service'

interface RequestType {
  Params: {
    uid?: string
  }
  Querystring: {
    token?: string
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard(AuthStrategy.JWT) {
  jwtFromRequestFn = ExtractJwt.fromAuthHeaderAsBearerToken()

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private tokenService: TokenService,
    @InjectRedis() private readonly redis: Redis,
    @Inject(AppConfig.KEY) private appConfig: IAppConfig,
  ) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    const request = context.switchToHttp().getRequest<Request>()
    if (RouterWhiteList.includes(request.path || request.url))
      return true
    if (request.method !== 'GET' && !request.url.includes('/auth/login'))
      checkIsDemoMode()

    const isSse = request.headers.accept === 'text/event-stream'

    if (isSse && !request.headers.authorization?.startsWith('Bearer ')) {
      const { token } = request.query as any
      if (token)
        request.headers.authorization = `Bearer ${token}`
    }

    const token = this.jwtFromRequestFn(request)

    if (await this.redis.get(genTokenBlacklistKey(token))) {
      throw new BusinessException(ErrorEnum.INVALID_LOGIN)

      // Store token in request for later use
    }(request as any).accessToken = token

    let result: any = false
    try {
      result = await super.canActivate(context)
    }
    catch (err) {
      if (isPublic)
        return true

      if (isEmpty(token))
        throw new UnauthorizedException('Not logged in')

      if (err instanceof UnauthorizedException)
        throw new BusinessException(ErrorEnum.INVALID_LOGIN)

      const isValid = isNil(token)
        ? undefined
        : await this.tokenService.checkAccessToken(token!)

      if (!isValid)
        throw new BusinessException(ErrorEnum.INVALID_LOGIN)
    }

    const user = request.user as IAuthUser

    if (isSse) {
      const { uid } = request.params as any

      if (Number(uid) !== user.uid)
        throw new UnauthorizedException('Path parameter uid does not match the uid of the current token logged in user')
    }

    const pv = await this.authService.getPasswordVersionByUid(user.uid)
    if (pv !== `${user.pv}`) {
      throw new BusinessException(ErrorEnum.INVALID_LOGIN)
    }

    if (!this.appConfig.multiDeviceLogin) {
      const cacheToken = await this.authService.getTokenByUid(user.uid)

      if (token !== cacheToken) {
        throw new BusinessException(ErrorEnum.ACCOUNT_LOGGED_IN_ELSEWHERE)
      }
    }

    return result
  }

  handleRequest(err, user, info) {
    if (err || !user)
      throw err || new UnauthorizedException()

    return user
  }
}
