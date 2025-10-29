import { ForbiddenException } from '@nestjs/common'

import { envBoolean } from '~/global/env'
import { MenuEntity } from '~/modules/system/menu/menu.entity'
import { isExternal } from '~/utils/is.util'

import { uniqueSlash } from './tool.util'

export interface RouteRecordRaw {
  id: number
  path: string
  name: string
  component?: string
  redirect?: string
  meta: {
    title: string
    icon: string
    isExt: boolean
    extOpenMode: number
    type: number
    orderNo: number
    show: number
    activeMenu: string
    status: number
    keepAlive: number
  }
  children?: RouteRecordRaw[]
}

function createRoute(menu: MenuEntity, _isRoot: boolean): RouteRecordRaw {
  const commonMeta: RouteRecordRaw['meta'] = {
    title: menu.name,
    icon: menu.icon,
    isExt: menu.isExt,
    extOpenMode: menu.extOpenMode,
    type: menu.type,
    orderNo: menu.orderNo,
    show: menu.show,
    activeMenu: menu.activeMenu,
    status: menu.status,
    keepAlive: menu.keepAlive,
  }

  if (isExternal(menu.path)) {
    return {
      id: menu.id,
      path: menu.path,
      name: menu.name,
      meta: { ...commonMeta },
    }
  }

  if (menu.type === 0) {
    return {
      id: menu.id,
      path: menu.path,
      component: menu.component,
      name: menu.name,
      meta: { ...commonMeta },
    }
  }

  return {
    id: menu.id,
    path: menu.path,
    name: menu.name,
    component: menu.component,
    meta: {
      ...commonMeta,
    },
  }
}

function filterAsyncRoutes(menus: MenuEntity[], parentRoute: MenuEntity): RouteRecordRaw[] {
  const res: RouteRecordRaw[] = []

  menus.forEach((menu) => {
    if (menu.type === 2 || !menu.status) {
      return
    }
    let realRoute: RouteRecordRaw

    const genFullPath = (path: string, parentPath) => {
      return uniqueSlash(path.startsWith('/') ? path : `/${parentPath}/${path}`)
    }

    if (!parentRoute && !menu.parentId && menu.type === 1) {
      realRoute = createRoute(menu, true)
    }
    else if (!parentRoute && !menu.parentId && menu.type === 0) {
      const childRoutes = filterAsyncRoutes(menus, menu)
      realRoute = createRoute(menu, true)
      if (childRoutes && childRoutes.length > 0) {
        realRoute.redirect = genFullPath(childRoutes[0].path, realRoute.path)
        realRoute.children = childRoutes
      }
    }
    else if (
      parentRoute
      && parentRoute.id === menu.parentId
      && menu.type === 1
    ) {
      realRoute = createRoute(menu, false)
    }
    else if (
      parentRoute
      && parentRoute.id === menu.parentId
      && menu.type === 0
    ) {
      const childRoutes = filterAsyncRoutes(menus, menu)
      realRoute = createRoute(menu, false)
      if (childRoutes && childRoutes.length > 0) {
        realRoute.redirect = genFullPath(childRoutes[0].path, realRoute.path)
        realRoute.children = childRoutes
      }
    }
    if (realRoute)
      res.push(realRoute)
  })
  return res
}

export function generatorRouters(menus: MenuEntity[]) {
  return filterAsyncRoutes(menus, null)
}

function filterMenuToTable(menus: MenuEntity[], parentMenu) {
  const res = []
  menus.forEach((menu) => {
    let realMenu
    if (!parentMenu && !menu.parentId && menu.type === 1) {
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    }
    else if (!parentMenu && !menu.parentId && menu.type === 0) {
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    }
    else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 1) {
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    }
    else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 0) {
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    }
    else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 2) {
      realMenu = { ...menu }
    }
    if (realMenu) {
      realMenu.pid = menu.id
      res.push(realMenu)
    }
  })
  return res
}

export function generatorMenu(menu: MenuEntity[]) {
  return filterMenuToTable(menu, null)
}

export function checkIsDemoMode() {
  if (envBoolean('IS_DEMO'))
    throw new ForbiddenException('Operations are not allowed in demo mode')
}
