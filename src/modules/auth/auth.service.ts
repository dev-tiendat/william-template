import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'

import { isEmpty } from 'lodash'
import { InjectRedis } from '~/common/decorators/inject-redis.decorator'

import { BusinessException } from '~/common/exceptions/biz.exception'

import { AppConfig, IAppConfig, ISecurityConfig, SecurityConfig } from '~/config'
import { ErrorEnum } from '~/constants/error-code.constant'
import { genAuthPermKey, genAuthPVKey, genAuthTokenKey, genTokenBlacklistKey } from '~/helper/genRedisKey'

import { UserService } from '~/modules/user/user.service'

import { md5 } from '~/utils'

import { LoginLogService } from '../system/log/services/login-log.service'
import { MenuService } from '../system/menu/menu.service'
import { RoleService } from '../system/role/role.service'

import { IOAuthUser, OAuthService } from './services/oauth.service'
import { TokenService } from './services/token.service'

@Injectable()
export class AuthService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private menuService: MenuService,
    private roleService: RoleService,
    private userService: UserService,
    private loginLogService: LoginLogService,
    private tokenService: TokenService,
    private oauthService: OAuthService,
    @Inject(SecurityConfig.KEY) private securityConfig: ISecurityConfig,
    @Inject(AppConfig.KEY) private appConfig: IAppConfig,
  ) {}

  async validateUser(credential: string, password: string): Promise<any> {
    const user = await this.userService.findUserByEmail(credential)

    if (isEmpty(user))
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)

    const comparePassword = md5(`${password}${user.psalt}`)
    if (user.password !== comparePassword)
      throw new BusinessException(ErrorEnum.INVALID_USERNAME_PASSWORD)

    if (user) {
      const { password, ...result } = user
      return result
    }

    return null
  }

  async loginWithEmail(
    email: string,
    password: string,

  ): Promise<{ user: any, tokens: { accessToken: string, refreshToken: string } }> {
    const user = await this.userService.findUserByEmail(email)
    if (isEmpty(user))
      throw new BusinessException(ErrorEnum.INVALID_USERNAME_PASSWORD)

    const comparePassword = md5(`${password}${user.psalt}`)
    if (user.password !== comparePassword)
      throw new BusinessException(ErrorEnum.INVALID_USERNAME_PASSWORD)

    const roleIds = await this.roleService.getRoleIdsByUser(user.id)

    const roles = await this.roleService.getRoleValues(roleIds)

    const token = await this.tokenService.generateAccessToken(user.id, roles)

    await this.redis.set(genAuthTokenKey(user.id), token.accessToken, 'EX', this.securityConfig.jwtExprire)

    await this.redis.set(genAuthPVKey(user.id), 1)

    const permissions = await this.menuService.getPermissions(user.id)
    await this.setPermissionsCache(user.id, permissions)

    // await this.loginLogService.create(user.id, ip, ua)

    // Return user basic info without sensitive data
    const { password: _, psalt, ...userBasicInfo } = user

    return {
      user: userBasicInfo,
      tokens: {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      },
    }
  }

  // Deprecated: Use loginWithEmail instead
  async login(
    username: string,
    password: string,
  ): Promise<{ user: any, tokens: { accessToken: string, refreshToken: string } }> {
    return this.loginWithEmail(username, password)
  }

  async checkPassword(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email)

    const comparePassword = md5(`${password}${user.psalt}`)
    if (user.password !== comparePassword)
      throw new BusinessException(ErrorEnum.INVALID_USERNAME_PASSWORD)
  }

  async resetPassword(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email)

    await this.userService.forceUpdatePassword(user.id, password)
  }

  async clearLoginStatus(user: IAuthUser, accessToken: string): Promise<void> {
    const exp = user.exp ? (user.exp - Date.now() / 1000).toFixed(0) : this.securityConfig.jwtExprire
    await this.redis.set(genTokenBlacklistKey(accessToken), accessToken, 'EX', exp)
    if (this.appConfig.multiDeviceLogin)
      await this.tokenService.removeAccessToken(accessToken)
    else
      await this.userService.forbidden(user.uid, accessToken)
  }

  async getMenus(uid: number) {
    return this.menuService.getMenus(uid)
  }

  async getPermissions(uid: number): Promise<string[]> {
    return this.menuService.getPermissions(uid)
  }

  async getPermissionsCache(uid: number): Promise<string[]> {
    const permissionString = await this.redis.get(genAuthPermKey(uid))
    return permissionString ? JSON.parse(permissionString) : []
  }

  async setPermissionsCache(uid: number, permissions: string[]): Promise<void> {
    await this.redis.set(genAuthPermKey(uid), JSON.stringify(permissions))
  }

  async getPasswordVersionByUid(uid: number): Promise<string> {
    return this.redis.get(genAuthPVKey(uid))
  }

  async getTokenByUid(uid: number): Promise<string> {
    return this.redis.get(genAuthTokenKey(uid))
  }

  async loginWithOAuth(
    oauthUser: IOAuthUser,
  ): Promise<{ user: any, tokens: { accessToken: string, refreshToken: string }, isNewUser: boolean }> {
    const existingProvider = await this.oauthService.findOAuthProvider(
      oauthUser.provider,
      oauthUser.providerId,
    )

    let user
    let isNewUser = false

    if (existingProvider) {
      user = existingProvider.user

      await this.oauthService.upsertOAuthProvider(user.id, oauthUser)
    }
    else {
      if (!oauthUser.email) {
        throw new BusinessException(ErrorEnum.OAUTH_EMAIL_REQUIRED)
      }

      user = await this.userService.findUserByEmail(oauthUser.email)

      if (!user) {
        user = await this.userService.createOAuthUser({
          email: oauthUser.email,
          fullName: oauthUser.name,
          avatarUrl: oauthUser.avatar,
        })
        isNewUser = true
      }

      await this.oauthService.upsertOAuthProvider(user.id, oauthUser)
    }

    const roleIds = await this.roleService.getRoleIdsByUser(user.id)
    const roles = await this.roleService.getRoleValues(roleIds)
    const token = await this.tokenService.generateAccessToken(user.id, roles)

    await this.redis.set(genAuthTokenKey(user.id), token.accessToken, 'EX', this.securityConfig.jwtExprire)
    await this.redis.set(genAuthPVKey(user.id), 1)

    const permissions = await this.menuService.getPermissions(user.id)
    await this.setPermissionsCache(user.id, permissions)

    // await this.loginLogService.create(user.id, ip, ua)

    // Return user basic info without sensitive data
    const { password, psalt, ...userBasicInfo } = user

    return {
      user: userBasicInfo,
      tokens: {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      },
      isNewUser,
    }
  }
}
