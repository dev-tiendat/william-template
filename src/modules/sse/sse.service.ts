import { Injectable } from '@nestjs/common'

@Injectable()
export class SseService {
  // Stub service - implement SSE functionality here if needed

  noticeClientToUpdateMenusByMenuIds(menuIds: number[]): void {
    // TODO: Implement SSE notification
  }

  noticeClientToUpdateMenusByUserIds(userIds: number[]): void {
    // TODO: Implement SSE notification
  }

  noticeClientToUpdateMenusByRoleIds(roleIds: number[]): void {
    // TODO: Implement SSE notification
  }
}
