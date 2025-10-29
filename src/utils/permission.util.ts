import { ForbiddenException } from '@nestjs/common'

import { envBoolean } from '~/global/env'
import { MenuEntity } from '~/modules/system/menu/menu.entity'

export interface RouteRecordRaw {
  id: number
  path: string
  name: string
  meta: {
    title: string
    permission?: string
    status: number
  }
}

export function generatorRouters(menus: MenuEntity[]): RouteRecordRaw[] {
  return menus
    .filter(menu => menu.status === 1)
    .map(menu => ({
      id: menu.id,
      path: menu.path || '',
      name: menu.name,
      meta: {
        title: menu.name,
        permission: menu.permission,
        status: menu.status,
      },
    }))
}

export function generatorMenu(menus: MenuEntity[]) {
  return menus
}

export function checkIsDemoMode() {
  if (envBoolean('IS_DEMO'))
    throw new ForbiddenException('Operations are not allowed in demo mode')
}
