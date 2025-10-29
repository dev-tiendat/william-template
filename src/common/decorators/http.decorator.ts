import type { ExecutionContext } from '@nestjs/common'

import type { Request } from 'express'
import { createParamDecorator } from '@nestjs/common'

import { getIp } from '~/utils/ip.util'

export const Ip = createParamDecorator((_, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request>()
  return getIp(request)
})

export const Uri = createParamDecorator((_, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request>()
  return (request as any).route?.path || request.path
})
