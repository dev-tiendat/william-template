import { Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { isEmpty, isNil } from 'lodash'
import { EntityManager, In, Like, Repository } from 'typeorm'

import { PagerDto } from '~/common/dto/pager.dto'
import { ROOT_ROLE_ID } from '~/constants/system.constant'
import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/pagination'
import { MenuEntity } from '~/modules/system/menu/menu.entity'
import { RoleEntity } from '~/modules/system/role/role.entity'

import { RoleDto, RoleQueryDto, RoleUpdateDto } from './role.dto'

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  async findAll({
    page,
    pageSize,
  }: PagerDto): Promise<Pagination<RoleEntity>> {
    return paginate(this.roleRepository, { page, pageSize })
  }

  async list({
    page,
    pageSize,
    name,
    value,
    remark,
    status,
  }: RoleQueryDto): Promise<Pagination<RoleEntity>> {
    const queryBuilder = await this.roleRepository
      .createQueryBuilder('role')
      .where({
        ...(name ? { name: Like(`%${name}%`) } : null),
        ...(value ? { value: Like(`%${value}%`) } : null),
        ...(remark ? { remark: Like(`%${remark}%`) } : null),
        ...(!isNil(status) ? { status } : null),
      })

    return paginate<RoleEntity>(queryBuilder, {
      page,
      pageSize,
    })
  }

  async info(id: number) {
    const info = await this.roleRepository
      .createQueryBuilder('role')
      .where({
        id,
      })
      .getOne()

    const menus = await this.menuRepository.find({
      where: { roles: { id } },
      select: ['id'],
    })

    return { ...info, menuIds: menus.map(m => m.id) }
  }

  async delete(id: number): Promise<void> {
    if (id === ROOT_ROLE_ID)
      throw new Error('Cannot delete super administrator')
    await this.roleRepository.delete(id)
  }

  async create({ menuIds, ...data }: RoleDto): Promise<{ roleId: number }> {
    const role = await this.roleRepository.save({
      ...data,
      menus: menuIds
        ? await this.menuRepository.findBy({ id: In(menuIds) })
        : [],
    })

    return { roleId: role.id }
  }

  async update(id, { menuIds, ...data }: RoleUpdateDto): Promise<void> {
    await this.roleRepository.update(id, data)
    await this.entityManager.transaction(async (manager) => {
      const role = await this.roleRepository.findOne({ where: { id } })
      role.menus = menuIds?.length
        ? await this.menuRepository.findBy({ id: In(menuIds) })
        : []
      await manager.save(role)
    })
  }

  async getRoleIdsByUser(id: number): Promise<number[]> {
    const roles = await this.roleRepository.find({
      where: {
        users: { id },
      },
    })

    if (!isEmpty(roles))
      return roles.map(r => r.id)

    return []
  }

  async getRoleValues(ids: number[]): Promise<string[]> {
    return (
      await this.roleRepository.findBy({
        id: In(ids),
      })
    ).map(r => r.value)
  }

  async isAdminRoleByUser(uid: number): Promise<boolean> {
    const roles = await this.roleRepository.find({
      where: {
        users: { id: uid },
      },
    })

    if (!isEmpty(roles)) {
      return roles.some(
        r => r.id === ROOT_ROLE_ID,
      )
    }
    return false
  }

  hasAdminRole(rids: number[]): boolean {
    return rids.includes(ROOT_ROLE_ID)
  }

  async checkUserByRoleId(id: number): Promise<boolean> {
    return this.roleRepository.exist({
      where: {
        users: {
          roles: { id },
        },
      },
    })
  }
}
