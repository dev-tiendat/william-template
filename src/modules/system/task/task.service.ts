import { InjectQueue } from '@nestjs/bull'
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common'
import { ModuleRef, Reflector } from '@nestjs/core'
import { UnknownElementException } from '@nestjs/core/errors/exceptions/unknown-element.exception'
import { InjectRepository } from '@nestjs/typeorm'
import { Queue } from 'bull'
import Redis from 'ioredis'
import { isEmpty, isNil } from 'lodash'
import { Like, Repository } from 'typeorm'
import { InjectRedis } from '~/common/decorators/inject-redis.decorator'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'

import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/pagination'

import { TaskEntity } from '~/modules/system/task/task.entity'
import { MISSION_DECORATOR_KEY } from '~/modules/tasks/mission.decorator'

import {
  SYS_TASK_QUEUE_NAME,
  SYS_TASK_QUEUE_PREFIX,
  TaskStatus,
} from './constant'
import { TaskDto, TaskQueryDto, TaskUpdateDto } from './task.dto'

@Injectable()
export class TaskService implements OnModuleInit {
  private logger = new Logger(TaskService.name)

  constructor(
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
    @InjectQueue(SYS_TASK_QUEUE_NAME) private taskQueue: Queue,
    private moduleRef: ModuleRef,
    private reflector: Reflector,
    @InjectRedis() private redis: Redis,
  ) {}

  /**
   * module init
   */
  async onModuleInit() {
    await this.initTask()
  }

  /**
   * Initialize tasks, called before system startup
   */
  async initTask(): Promise<void> {
    const initKey = `${SYS_TASK_QUEUE_PREFIX}:init`
    // Prevent duplicate initialization
    const result = await this.redis
      .multi()
      .setnx(initKey, new Date().getTime())
      .expire(initKey, 60 * 30)
      .exec()
    if (result[0][1] === 0) {
      // Skip if lock exists to prevent duplicate initialization
      this.logger.log('Init task is lock', TaskService.name)
      return
    }
    const jobs = await this.taskQueue.getJobs([
      'active',
      'delayed',
      'failed',
      'paused',
      'waiting',
      'completed',
    ])
    jobs.forEach((j) => {
      j.remove()
    })

    // Find all tasks that need to run
    const tasks = await this.taskRepository.findBy({ status: 1 })
    if (tasks && tasks.length > 0) {
      for (const t of tasks)
        await this.start(t)
    }
    // Release lock after startup
    await this.redis.del(initKey)
  }

  async list({
    page,
    pageSize,
    name,
    service,
    type,
    status,
  }: TaskQueryDto): Promise<Pagination<TaskEntity>> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where({
        ...(name ? { name: Like(`%${name}%`) } : null),
        ...(service ? { service: Like(`%${service}%`) } : null),
        ...(type ? { type } : null),
        ...(!isNil(status) ? { status } : null),
      })
      .orderBy('task.id', 'ASC')

    return paginate(queryBuilder, { page, pageSize })
  }

  /**
   * task info
   */
  async info(id: number): Promise<TaskEntity> {
    const task = this.taskRepository
      .createQueryBuilder('task')
      .where({ id })
      .getOne()

    if (!task)
      throw new NotFoundException('Task Not Found')

    return task
  }

  /**
   * delete task
   */
  async delete(task: TaskEntity): Promise<void> {
    if (!task)
      throw new BadRequestException('Task is Empty')

    await this.stop(task)
    await this.taskRepository.delete(task.id)
  }

  /**
   * Manual execution once
   */
  async once(task: TaskEntity): Promise<void | never> {
    if (task) {
      await this.taskQueue.add(
        { id: task.id, service: task.service, args: task.data },
        { jobId: task.id, removeOnComplete: true, removeOnFail: true },
      )
    }
    else {
      throw new BadRequestException('Task is Empty')
    }
  }

  async create(dto: TaskDto): Promise<void> {
    const result = await this.taskRepository.save(dto)
    const task = await this.info(result.id)
    if (result.status === 0)
      await this.stop(task)
    else if (result.status === TaskStatus.Activited)
      await this.start(task)
  }

  async update(id: number, dto: TaskUpdateDto): Promise<void> {
    await this.taskRepository.update(id, dto)
    const task = await this.info(id)
    if (task.status === 0)
      await this.stop(task)
    else if (task.status === TaskStatus.Activited)
      await this.start(task)
  }

  /**
   * Start task
   */
  async start(task: TaskEntity): Promise<void> {
    if (!task)
      throw new BadRequestException('Task is Empty')

    // Stop previously existing tasks first
    await this.stop(task)
    let repeat: any
    if (task.type === 1) {
      // Interval Repeat every millis (cron setting cannot be used together with this setting.)
      repeat = {
        every: task.every,
      }
    }
    else {
      // cron
      repeat = {
        cron: task.cron,
      }
      // Start date when the repeat job should start repeating (only with cron).
      if (task.startTime)
        repeat.startDate = task.startTime

      if (task.endTime)
        repeat.endDate = task.endTime
    }
    if (task.limit > 0)
      repeat.limit = task.limit

    const job = await this.taskQueue.add(
      { id: task.id, service: task.service, args: task.data },
      { jobId: task.id, removeOnComplete: true, removeOnFail: true, repeat },
    )
    if (job && job.opts) {
      await this.taskRepository.update(task.id, {
        jobOpts: JSON.stringify(job.opts.repeat),
        status: 1,
      })
    }
    else {
      // update status to 0, mark task as paused because startup failed
      await job?.remove()
      await this.taskRepository.update(task.id, {
        status: TaskStatus.Disabled,
      })
      throw new BadRequestException('Task Start failed')
    }
  }

  /**
   * Stop task
   */
  async stop(task: TaskEntity): Promise<void> {
    if (!task)
      throw new BadRequestException('Task is Empty')

    const exist = await this.existJob(task.id.toString())
    if (!exist) {
      await this.taskRepository.update(task.id, {
        status: TaskStatus.Disabled,
      })
      return
    }
    const jobs = await this.taskQueue.getJobs([
      'active',
      'delayed',
      'failed',
      'paused',
      'waiting',
      'completed',
    ])
    jobs
      .filter(j => j.data.id === task.id)
      .forEach(async (j) => {
        await j.remove()
      })

    // Remove current task from queue
    await this.taskQueue.removeRepeatable(JSON.parse(task.jobOpts))

    await this.taskRepository.update(task.id, { status: TaskStatus.Disabled })
    // if (task.jobOpts) {
    //   await this.app.queue.sys.removeRepeatable(JSON.parse(task.jobOpts));
    //   // update status
    //   await this.getRepo().admin.sys.Task.update(task.id, { status: TaskStatus.Disabled, });
    // }
  }

  /**
   * Check if task exists in queue
   */
  async existJob(jobId: string): Promise<boolean> {
    // https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueremoverepeatablebykey
    const jobs = await this.taskQueue.getRepeatableJobs()
    const ids = jobs.map((e) => {
      return e.id
    })
    return ids.includes(jobId)
  }

  /**
   * Update completion status, remove task and modify status if completed
   */
  async updateTaskCompleteStatus(tid: number): Promise<void> {
    const jobs = await this.taskQueue.getRepeatableJobs()
    const task = await this.taskRepository.findOneBy({ id: tid })
    // If next execution time is less than current time, it means execution is completed.
    for (const job of jobs) {
      const currentTime = new Date().getTime()
      if (job.id === tid.toString() && job.next < currentTime) {
        // If next execution time is less than current time, it means execution is completed.
        await this.stop(task)
        break
      }
    }
  }

  /**
   * Check if service has annotation definition
   */
  async checkHasMissionMeta(
    nameOrInstance: string | unknown,
    exec: string,
  ): Promise<void | never> {
    try {
      let service: any
      if (typeof nameOrInstance === 'string')
        service = await this.moduleRef.get(nameOrInstance, { strict: false })
      else
        service = nameOrInstance

      // The executed task does not exist
      if (!service || !(exec in service))
        throw new NotFoundException('Task does not exist')

      // Check if Mission annotation exists
      const hasMission = this.reflector.get<boolean>(
        MISSION_DECORATOR_KEY,
        service.constructor,
      )
      // If not, throw error
      if (!hasMission)
        throw new BusinessException(ErrorEnum.INSECURE_MISSION)
    }
    catch (e) {
      if (e instanceof UnknownElementException) {
        // Task does not exist
        throw new NotFoundException('Task does not exist')
      }
      else {
        // Other errors are not handled, continue to throw
        throw e
      }
    }
  }

  /**
   * Call service based on serviceName, e.g. LogService.clearReqLog
   */
  async callService(name: string, args: string): Promise<void> {
    if (name) {
      const [serviceName, methodName] = name.split('.')
      if (!methodName)
        throw new BadRequestException('serviceName define BadRequestException')

      const service = await this.moduleRef.get(serviceName, {
        strict: false,
      })

      // Security annotation check
      await this.checkHasMissionMeta(service, methodName)
      if (isEmpty(args)) {
        await service[methodName]()
      }
      else {
        // Parameter security check
        const parseArgs = this.safeParse(args)

        if (Array.isArray(parseArgs)) {
          // Array form automatically expands to method parameter callback
          await service[methodName](...parseArgs)
        }
        else {
          await service[methodName](parseArgs)
        }
      }
    }
  }

  safeParse(args: string): unknown | string {
    try {
      return JSON.parse(args)
    }
    catch (e) {
      return args
    }
  }
}
