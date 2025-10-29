import { Module } from '@nestjs/common'

import { RouterModule } from '@nestjs/core'

import { UserModule } from '../user/user.module'

import { LogModule } from './log/log.module'
import { MenuModule } from './menu/menu.module'
import { RoleModule } from './role/role.module'
import { TaskModule } from './task/task.module'

const modules = [
  UserModule,
  RoleModule,
  MenuModule,
  LogModule,
  TaskModule,
]

@Module({
  imports: [
    ...modules,
    RouterModule.register([
      {
        path: 'system',
        module: SystemModule,
        children: [...modules],
      },
    ]),
  ],
  exports: [...modules],
})
export class SystemModule {}
