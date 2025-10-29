import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinTable, ManyToMany, Relation } from 'typeorm'

import { CompleteEntity } from '~/common/entity/common.entity'

import { UserEntity } from '../../user/user.entity'
import { MenuEntity } from '../menu/menu.entity'

@Entity({ name: 'sys_role' })
export class RoleEntity extends CompleteEntity {
  @Column({ length: 50, unique: true })
  @ApiProperty({ description: 'Role name' })
  name: string

  @Column({ unique: true, comment: 'Role identifier' })
  @ApiProperty({ description: 'Role identifier' })
  value: string

  @Column({ nullable: true })
  @ApiProperty({ description: 'Role description' })
  remark: string

  @Column({ type: 'smallint', nullable: true, default: 1 })
  @ApiProperty({ description: 'Status: 1 enabled, 0 disabled' })
  status: number

  @Column({ nullable: true })
  @ApiProperty({ description: 'Is default user' })
  default: boolean

  @ApiHideProperty()
  @ManyToMany(() => UserEntity, user => user.roles)
  users: Relation<UserEntity[]>

  @ApiHideProperty()
  @ManyToMany(() => MenuEntity, menu => menu.roles, {})
  @JoinTable({
    name: 'sys_role_menus',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menu_id', referencedColumnName: 'id' },
  })
  menus: Relation<MenuEntity[]>
}
