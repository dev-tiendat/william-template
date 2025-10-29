import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity } from 'typeorm'

import { CommonEntity } from '~/common/entity/common.entity'

@Entity({ name: 'sys_task' })
export class TaskEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  @ApiProperty({ description: 'Task name' })
  name: string

  @Column()
  @ApiProperty({ description: 'Task identifier' })
  service: string

  @Column({ type: 'tinyint', default: 0 })
  @ApiProperty({ description: 'Task type: 0 cron, 1 interval' })
  type: number

  @Column({ type: 'tinyint', default: 1 })
  @ApiProperty({ description: 'Task status: 0 disabled, 1 enabled' })
  status: number

  @Column({ name: 'start_time', type: 'datetime', nullable: true })
  @ApiProperty({ description: 'Start time' })
  startTime: Date

  @Column({ name: 'end_time', type: 'datetime', nullable: true })
  @ApiProperty({ description: 'End time' })
  endTime: Date

  @Column({ type: 'int', nullable: true, default: 0 })
  @ApiProperty({ description: 'Interval time' })
  limit: number

  @Column({ nullable: true })
  @ApiProperty({ description: 'Cron expression' })
  cron: string

  @Column({ type: 'int', nullable: true })
  @ApiProperty({ description: 'Execution count' })
  every: number

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Task parameters' })
  data: string

  @Column({ name: 'job_opts', type: 'text', nullable: true })
  @ApiProperty({ description: 'Task configuration' })
  jobOpts: string

  @Column({ nullable: true })
  @ApiProperty({ description: 'Task description' })
  remark: string
}
