import { Injectable } from '@nestjs/common'
import { Subscriber } from 'rxjs'
import { In } from 'typeorm'

import { ROOT_ROLE_ID } from '~/constants/system.constant'

import { RoleEntity } from '~/modules/system/role/role.entity'
import { UserEntity } from '~/modules/user/user.entity'

export interface MessageEvent {
  data?: string | number | object
  id?: string
  type?: 'ping' | 'close' | 'updatePermsAndMenus' | 'updateOnlineUserCount'
  retry?: number
}

const clientMap: Map<number, Subscriber<MessageEvent>[]> = new Map()

@Injectable()
export class SseService {
  addClient(uid: number, subscriber: Subscriber<MessageEvent>) {
    const clients = clientMap.get(uid) || []
    clientMap.set(uid, clients.concat(subscriber))
  }

  removeClient(uid: number, subscriber: Subscriber<MessageEvent>): void {
    const clients = clientMap.get(uid)
    const targetIndex = clients?.findIndex(client => client === subscriber)
    if (targetIndex !== -1)
      clients?.splice(targetIndex, 1).at(0)?.complete()
  }

  removeClients(uid: number): void {
    const clients = clientMap.get(uid)
    clients?.forEach((client) => {
      client?.complete()
    })
    clientMap.delete(uid)
  }

  sendToClients(uid: number, data: MessageEvent): void {
    const clients = clientMap.get(uid)
    clients?.forEach((client) => {
      client?.next?.(data)
    })
  }

  sendToAllUser(data: MessageEvent): void {
    clientMap.forEach((client, uid) => {
      this.sendToClients(uid, data)
    })
  }

  async noticeClientToUpdateMenusByUserIds(uid: number | number[]) {
    const userIds = [].concat(uid) as number[]
    userIds.forEach((uid) => {
      this.sendToClients(uid, { type: 'updatePermsAndMenus' })
    })
  }

  async noticeClientToUpdateMenusByMenuIds(menuIds: number[]): Promise<void> {
    const roleMenus = await RoleEntity.find({
      where: {
        menus: {
          id: In(menuIds),
        },
      },
    })
    const roleIds = roleMenus.map(n => n.id).concat(ROOT_ROLE_ID)
    await this.noticeClientToUpdateMenusByRoleIds(roleIds)
  }

  async noticeClientToUpdateMenusByRoleIds(roleIds: number[]): Promise<void> {
    const users = await UserEntity.find({
      where: {
        roles: {
          id: In(roleIds),
        },
      },
    })
    if (users) {
      const userIds = users.map(n => n.id)
      await this.noticeClientToUpdateMenusByUserIds(userIds)
    }
  }
}
