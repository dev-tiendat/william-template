import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity } from 'typeorm'

import { CommonEntity } from '~/common/entity/common.entity'

@Entity({ name: 'sys_config' })
export class ParamConfigEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: 'Configuration name' })
  name: string

  @Column({ type: 'varchar', length: 50, unique: true })
  @ApiProperty({ description: 'Configuration key' })
  key: string

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({ description: 'Configuration value' })
  value: string

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({ description: 'Configuration description' })
  remark: string
}
