import { Column, Entity, ManyToMany, Relation } from 'typeorm'

import { CompleteEntity } from '~/common/entity/common.entity'

import { RoleEntity } from '../role/role.entity'

@Entity({ name: 'sys_menu' })
export class MenuEntity extends CompleteEntity {
  @Column()
  name: string

  @Column({ nullable: true })
  path: string

  @Column({ nullable: true })
  permission: string

  @Column({ type: 'smallint', default: 1 })
  status: number

  @ManyToMany(() => RoleEntity, role => role.menus, {
    onDelete: 'CASCADE',
  })
  roles: Relation<RoleEntity[]>
}
