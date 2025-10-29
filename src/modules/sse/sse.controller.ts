import { BeforeApplicationShutdown, Controller, Headers, Ip, Param, ParseIntPipe, Req, Res, Sse } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { Request, Response } from 'express'

import { interval, Observable } from 'rxjs'

import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'

import { OnlineService } from '../system/online/online.service'
import { MessageEvent, SseService } from './sse.service'

@ApiTags('System - SSE Module')
@ApiSecurityAuth()
@SkipThrottle()
@Controller('sse')
export class SseController implements BeforeApplicationShutdown {
  private replyMap: Map<number, Response> = new Map()

  constructor(private readonly sseService: SseService, private onlineService: OnlineService) { }

  private closeAllConnect() {
    this.sseService.sendToAllUser({
      type: 'close',
      data: 'bye~',
    })
    this.replyMap.forEach((reply) => {
      reply.end()
    })
  }

  beforeApplicationShutdown() {
    this.closeAllConnect()
  }

  @ApiOperation({ summary: 'Server push message' })
  @Sse(':uid')
  async sse(
    @Param('uid', ParseIntPipe) uid: number,
    @Req() req: Request,
    @Res() res: Response,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ): Promise<Observable<MessageEvent>> {
    this.replyMap.set(uid, res)
    this.onlineService.addOnlineUser((req as any).accessToken, ip, ua)

    return new Observable((subscriber) => {
      const subscription = interval(12000).subscribe(() => {
        subscriber.next({ type: 'ping' })
      })
      this.sseService.addClient(uid, subscriber)

      req.on('close', () => {
        subscription.unsubscribe()
        this.sseService.removeClient(uid, subscriber)
        this.replyMap.delete(uid)
        this.onlineService.removeOnlineUser((req as any).accessToken)
        console.log(`user-${uid} disconnected`)
      })
    })
  }
}
