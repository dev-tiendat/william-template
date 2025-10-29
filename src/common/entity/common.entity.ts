import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Exclude } from 'class-transformer'
import dayjs from 'dayjs'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
  VirtualColumn,
} from 'typeorm'

const dateTransformer: ValueTransformer = {
  to(value) {
    return value
  },
  from(value) {
    return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
  },
}

export abstract class CommonEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @CreateDateColumn({ name: 'created_at', transformer: dateTransformer })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', transformer: dateTransformer })
  updatedAt: Date
}

export abstract class CompleteEntity extends CommonEntity {
  @ApiHideProperty()
  @Exclude()
  @Column({ name: 'create_by', update: false, nullable: true })
  createBy: number

  @ApiHideProperty()
  @Exclude()
  @Column({ name: 'update_by', nullable: true })
  updateBy: number

  @ApiProperty({ description: 'Creator email' })
  @VirtualColumn({ query: alias => `SELECT email FROM users WHERE id = ${alias}.create_by` })
  creator: string

  @ApiProperty({ description: 'Updater email' })
  @VirtualColumn({ query: alias => `SELECT email FROM users WHERE id = ${alias}.update_by` })
  updater: string
}
