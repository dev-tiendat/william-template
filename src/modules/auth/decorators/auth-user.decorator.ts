import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

type Payload = keyof IAuthUser

/**
 * @description Get current logged-in user information and mount it to request
 */
export const AuthUser = createParamDecorator(
  (data: Payload, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>()
    // auth guard will mount this
    const user = request.user as IAuthUser

    return data ? user?.[data] : user
  },
)
