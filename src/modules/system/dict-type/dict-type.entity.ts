import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity } from 'typeorm'

import { CompleteEntity } from '~/common/entity/common.entity'

@Entity({ name: 'sys_dict_type' })
export class DictTypeEntity extends CompleteEntity {
  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: 'Dictionary name' })
  name: string

  @Column({ type: 'varchar', length: 50, unique: true })
  @ApiProperty({ description: 'Dictionary code' })
  code: string

  @Column({ type: 'tinyint', default: 1 })
  @ApiProperty({ description: 'Status' })
  status: number

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({ description: 'Remark' })
  remark: string
}
