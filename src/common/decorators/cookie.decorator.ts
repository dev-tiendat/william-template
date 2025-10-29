import type { ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import { createParamDecorator } from '@nestjs/common'

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>()
  return data ? request.cookies?.[data] : request.cookies
})
