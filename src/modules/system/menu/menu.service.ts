import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import Redis from 'ioredis'
import { concat, isEmpty, isNil, uniq } from 'lodash'
import { IsNull, Like, Not, Repository } from 'typeorm'

import { InjectRedis } from '~/common/decorators/inject-redis.decorator'

import { RedisKeys } from '~/constants/cache.constant'
import { genAuthPermKey, genAuthTokenKey } from '~/helper/genRedisKey'
import { MenuEntity } from '~/modules/system/menu/menu.entity'

import { RoleService } from '../role/role.service'

import { MenuDto, MenuQueryDto, MenuUpdateDto } from './menu.dto'

@Injectable()
export class MenuService {
  constructor(
    @InjectRedis() private redis: Redis,
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>,
    private roleService: RoleService,
  ) {}

  async list({
    name,
    path,
    permission,
    status,
  }: MenuQueryDto): Promise<MenuEntity[]> {
    const menus = await this.menuRepository.find({
      where: {
        ...(name && { name: Like(`%${name}%`) }),
        ...(path && { path: Like(`%${path}%`) }),
        ...(permission && { permission: Like(`%${permission}%`) }),
        ...(!isNil(status) ? { status } : null),
      },
      order: { id: 'ASC' },
    })
    return menus
  }

  async create(menu: MenuDto): Promise<void> {
    await this.menuRepository.save(menu)
  }

  async update(id: number, menu: MenuUpdateDto): Promise<void> {
    await this.menuRepository.update(id, menu)
  }

  async getMenus(uid: number) {
    const roleIds = await this.roleService.getRoleIdsByUser(uid)
    let menus: MenuEntity[] = []

    if (isEmpty(roleIds))
      return []

    if (this.roleService.hasAdminRole(roleIds)) {
      menus = await this.menuRepository.find({ order: { id: 'ASC' } })
    }
    else {
      menus = await this.menuRepository
        .createQueryBuilder('menu')
        .innerJoinAndSelect('menu.roles', 'role')
        .andWhere('role.id IN (:...roleIds)', { roleIds })
        .orderBy('menu.id', 'ASC')
        .getMany()
    }

    return menus
  }

  async check(dto: Partial<MenuDto>): Promise<void | never> {
    // Simplified validation - no parent/child logic
    return
  }

  async getMenuItemInfo(mid: number): Promise<MenuEntity> {
    const menu = await this.menuRepository.findOneBy({ id: mid })
    return menu
  }

  async findRouterExist(path: string): Promise<boolean> {
    const menus = await this.menuRepository.findOneBy({ path })
    return !isEmpty(menus)
  }

  async getPermissions(uid: number): Promise<string[]> {
    const roleIds = await this.roleService.getRoleIdsByUser(uid)
    let permission: any[] = []
    let result: any = null
    if (this.roleService.hasAdminRole(roleIds)) {
      result = await this.menuRepository.findBy({
        permission: Not(IsNull()),
      })
    }
    else {
      if (isEmpty(roleIds))
        return permission

      result = await this.menuRepository
        .createQueryBuilder('menu')
        .innerJoinAndSelect('menu.roles', 'role')
        .andWhere('role.id IN (:...roleIds)', { roleIds })
        .andWhere('menu.permission IS NOT NULL')
        .getMany()
    }
    if (!isEmpty(result)) {
      result.forEach((e) => {
        if (e.permission)
          permission = concat(permission, e.permission.split(','))
      })
      permission = uniq(permission)
    }
    return permission
  }

  async deleteMenuItem(mids: number[]): Promise<void> {
    await this.menuRepository.delete(mids)
  }

  async refreshPerms(uid: number): Promise<void> {
    const perms = await this.getPermissions(uid)
    const online = await this.redis.get(genAuthTokenKey(uid))
    if (online) {
      await this.redis.set(genAuthPermKey(uid), JSON.stringify(perms))
    }
  }

  async refreshOnlineUserPerms(): Promise<void> {
    const onlineUserIds: string[] = await this.redis.keys(genAuthTokenKey('*'))
    if (onlineUserIds && onlineUserIds.length > 0) {
      const promiseArr = onlineUserIds
        .map(i => Number.parseInt(i.split(RedisKeys.AUTH_TOKEN_PREFIX)[1]))
        .filter(i => i)
        .map(async (uid) => {
          const perms = await this.getPermissions(uid)
          await this.redis.set(genAuthPermKey(uid), JSON.stringify(perms))
          return uid
        })
      await Promise.all(promiseArr)
      console.log('refreshOnlineUserPerms')
    }
  }

  async checkRoleByMenuId(id: number): Promise<boolean> {
    return !!(await this.menuRepository.findOne({
      where: {
        roles: {
          id,
        },
      },
    }))
  }
}
