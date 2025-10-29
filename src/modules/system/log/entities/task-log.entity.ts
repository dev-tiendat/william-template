import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm'

import { CommonEntity } from '~/common/entity/common.entity'

import { TaskEntity } from '../../task/task.entity'

@Entity({ name: 'sys_task_log' })
export class TaskLogEntity extends CommonEntity {
  @Column({ type: 'smallint', default: 0 })
  @ApiProperty({ description: 'Task status: 0 failed, 1 success' })
  status: number

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Task log information' })
  detail: string

  @Column({ type: 'int', nullable: true, name: 'consume_time', default: 0 })
  @ApiProperty({ description: 'Task execution time' })
  consumeTime: number

  @ManyToOne(() => TaskEntity)
  @JoinColumn({ name: 'task_id' })
  task: Relation<TaskEntity>
}
