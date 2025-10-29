import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import Redis from 'ioredis'
import { isEmpty, isNil } from 'lodash'
import { EntityManager, In, Like, Repository } from 'typeorm'

import { InjectRedis } from '~/common/decorators/inject-redis.decorator'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { ROOT_ROLE_ID, SYS_USER_INITPASSWORD } from '~/constants/system.constant'
import { UserStatus } from '~/database/enums/users.enum'

import { genAuthPermKey, genAuthPVKey, genAuthTokenKey, genOnlineUserKey } from '~/helper/genRedisKey'
import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/pagination'
import { AccountUpdateDto } from '~/modules/auth/dto/account.dto'
import { RegisterDto } from '~/modules/auth/dto/auth.dto'

import { md5, randomValue } from '~/utils'
import { AccessTokenEntity } from '../auth/entities/access-token.entity'

import { RoleEntity } from '../system/role/role.entity'
import { PasswordUpdateDto } from './dto/password.dto'
import { UserDto, UserQueryDto, UserUpdateDto } from './dto/user.dto'
import { UserEntity } from './user.entity'
import { AccountInfo } from './user.model'

@Injectable()
export class UserService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectEntityManager() private entityManager: EntityManager,
  ) { }

  async findUserById(id: number): Promise<UserEntity | undefined> {
    return this.userRepository
      .createQueryBuilder('user')
      .where({
        id,
        status: UserStatus.ACTIVE,
      })
      .getOne()
  }

  async findUserByEmail(email: string): Promise<UserEntity | undefined> {
    return this.userRepository
      .createQueryBuilder('user')
      .where({
        email,
        status: UserStatus.ACTIVE,
      })
      .getOne()
  }

  // Deprecated: Use findUserByEmail instead
  async findUserByUserName(username: string): Promise<UserEntity | undefined> {
    return this.findUserByEmail(username)
  }

  async getAccountInfo(uid: number): Promise<AccountInfo> {
    const user: UserEntity = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where(`user.id = :uid`, { uid })
      .getOne()

    if (isEmpty(user))
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)

    delete user?.psalt

    return user
  }

  async updateAccountInfo(uid: number, info: AccountUpdateDto): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid })
    if (isEmpty(user))
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)

    const data = {
      ...(info.email ? { email: info.email } : null),
      ...(info.avatarUrl ? { avatarUrl: info.avatarUrl } : null),
      ...(info.fullName ? { fullName: info.fullName } : null),
    }

    await this.userRepository.update(uid, data)
  }

  async updatePassword(uid: number, dto: PasswordUpdateDto): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid })
    if (isEmpty(user))
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)

    const comparePassword = md5(`${dto.oldPassword}${user.psalt}`)
    if (user.password !== comparePassword)
      throw new BusinessException(ErrorEnum.PASSWORD_MISMATCH)

    const password = md5(`${dto.newPassword}${user.psalt}`)
    await this.userRepository.update({ id: uid }, { password })
    await this.upgradePasswordV(user.id)
  }

  async forceUpdatePassword(uid: number, password: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid })

    const newPassword = md5(`${password}${user.psalt}`)
    await this.userRepository.update({ id: uid }, { password: newPassword })
    await this.upgradePasswordV(user.id)
  }

  async create({
    email,
    password,
    roleIds,
    ...data
  }: UserDto): Promise<void> {
    const exists = await this.userRepository.findOneBy({
      email,
    })
    if (!isEmpty(exists))
      throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)

    await this.entityManager.transaction(async (manager) => {
      const salt = randomValue(32)

      if (!password) {
        password = md5(`${SYS_USER_INITPASSWORD ?? '123456'}${salt}`)
      }
      else {
        password = md5(`${password}${salt}`)
      }
      const u = manager.create(UserEntity, {
        email,
        password,
        ...data,
        psalt: salt,
        roles: await this.roleRepository.findBy({ id: In(roleIds) }),
      })

      const result = await manager.save(u)
      return result
    })
  }

  async update(
    id: number,
    { password, roleIds, status, ...data }: UserUpdateDto,
  ): Promise<void> {
    await this.entityManager.transaction(async (manager) => {
      if (password)
        await this.forceUpdatePassword(id, password)

      await manager.update(UserEntity, id, {
        ...data,
        status,
      })

      const user = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'roles')
        .where('user.id = :id', { id })
        .getOne()
      if (roleIds) {
        await manager
          .createQueryBuilder()
          .relation(UserEntity, 'roles')
          .of(id)
          .addAndRemove(roleIds, user.roles)
      }

      if (status === UserStatus.INACTIVE) {
        await this.forbidden(id)
      }
    })
  }

  async info(id: number): Promise<UserEntity> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.id = :id', { id })
      .getOne()

    delete user.password
    delete user.psalt

    return user
  }

  async delete(userIds: number[]): Promise<void | never> {
    const rootUserId = await this.findRootUserId()
    if (userIds.includes(rootUserId))
      throw new BadRequestException('Cannot delete root user!')

    await this.userRepository.delete(userIds)
  }

  async findRootUserId(): Promise<number> {
    const user = await this.userRepository.findOneBy({
      roles: { id: ROOT_ROLE_ID },
    })
    return user.id
  }

  async list({
    page,
    pageSize,
    fullName,
    email,
    status,
  }: UserQueryDto): Promise<Pagination<UserEntity>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where({
        ...(fullName ? { fullName: Like(`%${fullName}%`) } : null),
        ...(email ? { email: Like(`%${email}%`) } : null),
        ...(!isNil(status) ? { status } : null),
      })

    return paginate<UserEntity>(queryBuilder, {
      page,
      pageSize,
    })
  }

  async forbidden(uid: number, accessToken?: string): Promise<void> {
    await this.redis.del(genAuthPVKey(uid))
    await this.redis.del(genAuthTokenKey(uid))
    await this.redis.del(genAuthPermKey(uid))
    if (accessToken) {
      const token = await AccessTokenEntity.findOne({
        where: { value: accessToken },
      })
      this.redis.del(genOnlineUserKey(token.id))
    }
  }

  async multiForbidden(uids: number[]): Promise<void> {
    if (uids) {
      const pvs: string[] = []
      const ts: string[] = []
      const ps: string[] = []
      uids.forEach((uid) => {
        pvs.push(genAuthPVKey(uid))
        ts.push(genAuthTokenKey(uid))
        ps.push(genAuthPermKey(uid))
      })
      await this.redis.del(pvs)
      await this.redis.del(ts)
      await this.redis.del(ps)
    }
  }

  async upgradePasswordV(id: number): Promise<void> {
    const v = await this.redis.get(genAuthPVKey(id))
    if (!isEmpty(v))
      await this.redis.set(genAuthPVKey(id), Number.parseInt(v) + 1)
  }

  async exist(email: string) {
    const user = await this.userRepository.findOneBy({ email })
    if (isNil(user))
      throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)

    return true
  }

  async register({ email, password, fullName }: RegisterDto): Promise<void> {
    const exists = await this.userRepository.findOneBy({ email })
    if (!isEmpty(exists))
      throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)

    await this.entityManager.transaction(async (manager) => {
      const salt = randomValue(32)
      const hashedPassword = md5(`${password}${salt}`)

      // Get default role
      const defaultRole = await this.roleRepository.findOne({
        where: { default: true },
      })

      const u = manager.create(UserEntity, {
        email,
        password: hashedPassword,
        fullName,
        status: UserStatus.ACTIVE,
        psalt: salt,
        roles: defaultRole ? [defaultRole] : [],
      })

      const user = await manager.save(u)

      return user
    })
  }

  async createOAuthUser(userData: {
    email: string
    fullName?: string
    avatarUrl?: string
    firebaseUid?: string
  }): Promise<UserEntity> {
    return this.entityManager.transaction(async (manager) => {
      const salt = randomValue(32)
      const password = md5(`${randomValue(16)}${salt}`)

      const defaultRole = await this.roleRepository.findOne({
        where: { default: true },
      })

      if (!defaultRole) {
        throw new BusinessException(ErrorEnum.DEFAULT_ROLE_NOT_FOUND)
      }

      const user = manager.create(UserEntity, {
        email: userData.email,
        fullName: userData.fullName || userData.email,
        avatarUrl: userData.avatarUrl,
        firebaseUid: userData.firebaseUid,
        password,
        psalt: salt,
        status: UserStatus.ACTIVE,
        roles: [defaultRole],
      })

      return manager.save(user)
    })
  }
}
