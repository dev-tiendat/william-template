import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'

import { isArray, isEmpty, isNil } from 'lodash'

import { DataSource, In, Repository } from 'typeorm'

import { BusinessException } from '~/common/exceptions/biz.exception'

import { ErrorEnum } from '~/constants/error-code.constant'

import { PUBLIC_KEY, RESOURCE_KEY, Roles } from '../auth.constant'
import { ResourceObject } from '../decorators/resource.decorator'

@Injectable()
export class ResourceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest<Request>()
    const isSse = request.headers.accept === 'text/event-stream'
    if (isPublic || isSse)
      return true

    const user = request.user as IAuthUser

    if (!user)
      return false

    const { entity, condition } = this.reflector.get<ResourceObject>(
      RESOURCE_KEY,
      context.getHandler(),
    ) ?? { entity: null, condition: null }

    if (entity && !user.roles?.includes(Roles.ADMIN)) {
      const repo: Repository<any> = this.dataSource.getRepository(entity)

      /**
       * Get request items (ids) to verify data ownership
       * @param request
       */
      const getRequestItems = (request?: Request): number[] => {
        const { params = {}, body = {}, query = {} } = (request ?? {}) as any
        const id = params.id ?? body.id ?? query.id

        if (id)
          return [id]

        const { items } = body
        return !isNil(items) && isArray(items) ? items : []
      }

      const items = getRequestItems(request)
      if (isEmpty(items))
        throw new BusinessException(ErrorEnum.REQUESTED_RESOURCE_NOT_FOUND)

      if (condition)
        return condition(repo, items, user)

      const recordQuery = {
        where: {
          id: In(items),
          user: { id: user.uid },
        },
        relations: ['user'],
      }

      const records = await repo.find(recordQuery)

      if (isEmpty(records))
        throw new BusinessException(ErrorEnum.REQUESTED_RESOURCE_NOT_FOUND)
    }

    return true
  }
}
