import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import Redis from 'ioredis'
import { concat, isEmpty, isNil, uniq } from 'lodash'
import { In, IsNull, Like, Not, Repository } from 'typeorm'

import { InjectRedis } from '~/common/decorators/inject-redis.decorator'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { RedisKeys } from '~/constants/cache.constant'
import { ErrorEnum } from '~/constants/error-code.constant'
import { genAuthPermKey, genAuthTokenKey } from '~/helper/genRedisKey'
import { SseService } from '~/modules/sse/sse.service'
import { MenuEntity } from '~/modules/system/menu/menu.entity'

import { deleteEmptyChildren, generatorMenu, generatorRouters } from '~/utils'

import { RoleService } from '../role/role.service'

import { MenuDto, MenuQueryDto, MenuUpdateDto } from './menu.dto'

@Injectable()
export class MenuService {
  constructor(
    @InjectRedis() private redis: Redis,
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>,
    private roleService: RoleService,
    private sseService: SseService,
  ) {}

  async list({
    name,
    path,
    permission,
    component,
    status,
  }: MenuQueryDto): Promise<MenuEntity[]> {
    const menus = await this.menuRepository.find({
      where: {
        ...(name && { name: Like(`%${name}%`) }),
        ...(path && { path: Like(`%${path}%`) }),
        ...(permission && { permission: Like(`%${permission}%`) }),
        ...(component && { component: Like(`%${component}%`) }),
        ...(!isNil(status) ? { status } : null),
      },
      order: { orderNo: 'ASC' },
    })
    const menuList = generatorMenu(menus)

    if (!isEmpty(menuList)) {
      deleteEmptyChildren(menuList)
      return menuList
    }
    return menus
  }

  async create(menu: MenuDto): Promise<void> {
    const result = await this.menuRepository.save(menu)
    this.sseService.noticeClientToUpdateMenusByMenuIds([result.id])
  }

  async update(id: number, menu: MenuUpdateDto): Promise<void> {
    await this.menuRepository.update(id, menu)
    this.sseService.noticeClientToUpdateMenusByMenuIds([id])
  }

  async getMenus(uid: number) {
    const roleIds = await this.roleService.getRoleIdsByUser(uid)
    let menus: MenuEntity[] = []

    if (isEmpty(roleIds))
      return generatorRouters([])

    if (this.roleService.hasAdminRole(roleIds)) {
      menus = await this.menuRepository.find({ order: { orderNo: 'ASC' } })
    }
    else {
      menus = await this.menuRepository
        .createQueryBuilder('menu')
        .innerJoinAndSelect('menu.roles', 'role')
        .andWhere('role.id IN (:...roleIds)', { roleIds })
        .orderBy('menu.order_no', 'ASC')
        .getMany()
    }

    const menuList = generatorRouters(menus)
    return menuList
  }

  async check(dto: Partial<MenuDto>): Promise<void | never> {
    if (dto.type === 2 && !dto.parentId) {
      throw new BusinessException(ErrorEnum.PERMISSION_REQUIRES_PARENT)
    }
    if (dto.type === 1 && dto.parentId) {
      const parent = await this.getMenuItemInfo(dto.parentId)
      if (isEmpty(parent))
        throw new BusinessException(ErrorEnum.PARENT_MENU_NOT_FOUND)

      if (parent && parent.type === 1) {
        throw new BusinessException(
          ErrorEnum.ILLEGAL_OPERATION_DIRECTORY_PARENT,
        )
      }
    }
  }

  async findChildMenus(mid: number): Promise<any> {
    const allMenus: any = []
    const menus = await this.menuRepository.findBy({ parentId: mid })
    for (const menu of menus) {
      if (menu.type !== 2) {
        const c = await this.findChildMenus(menu.id)
        allMenus.push(c)
      }
      allMenus.push(menu.id)
    }
    return allMenus
  }

  async getMenuItemInfo(mid: number): Promise<MenuEntity> {
    const menu = await this.menuRepository.findOneBy({ id: mid })
    return menu
  }

  async getMenuItemAndParentInfo(mid: number) {
    const menu = await this.menuRepository.findOneBy({ id: mid })
    let parentMenu: MenuEntity | undefined
    if (menu && menu.parentId)
      parentMenu = await this.menuRepository.findOneBy({ id: menu.parentId })

    return { menu, parentMenu }
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
        type: In([1, 2]),
      })
    }
    else {
      if (isEmpty(roleIds))
        return permission

      result = await this.menuRepository
        .createQueryBuilder('menu')
        .innerJoinAndSelect('menu.roles', 'role')
        .andWhere('role.id IN (:...roleIds)', { roleIds })
        .andWhere('menu.type IN (1,2)')
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

      this.sseService.noticeClientToUpdateMenusByUserIds([uid])
    }
  }

  async refreshOnlineUserPerms(isNoticeUser = true): Promise<void> {
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
      const uids = await Promise.all(promiseArr)
      console.log('refreshOnlineUserPerms')
      if (isNoticeUser)
        this.sseService.noticeClientToUpdateMenusByUserIds(uids)
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
