import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity } from 'typeorm'

import { CommonEntity } from '~/common/entity/common.entity'

@Entity({ name: 'tool_storage' })
export class Storage extends CommonEntity {
  @Column({ type: 'varchar', length: 200, comment: 'File name' })
  @ApiProperty({ description: 'File name' })
  name: string

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Real file name',
  })
  @ApiProperty({ description: 'Real file name' })
  fileName: string

  @Column({ name: 'ext_name', type: 'varchar', nullable: true })
  @ApiProperty({ description: 'File extension' })
  extName: string

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'File path' })
  path: string

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({ description: 'File type' })
  type: string

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({ description: 'File size' })
  size: string

  @Column({ nullable: true, name: 'user_id' })
  @ApiProperty({ description: 'User ID' })
  userId: number
}
