import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiResult } from '~/common/decorators/api-result.decorator'
import { IdParam } from '~/common/decorators/id-param.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { UpdaterPipe } from '~/common/pipes/updater.pipe'
import { definePermission, Perm } from '~/modules/auth/decorators/permission.decorator'
import { RoleEntity } from '~/modules/system/role/role.entity'

import { MenuService } from '../menu/menu.service'

import { RoleDto, RoleQueryDto, RoleUpdateDto } from './role.dto'
import { RoleInfo } from './role.model'
import { RoleService } from './role.service'

export const permissions = definePermission('system:role', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
} as const)

@ApiTags('System - Role Module')
@ApiSecurityAuth()
@Controller('roles')
export class RoleController {
  constructor(
    private roleService: RoleService,
    private menuService: MenuService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get role list' })
  @ApiResult({ type: [RoleEntity], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: RoleQueryDto) {
    return this.roleService.list(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role information' })
  @ApiResult({ type: RoleInfo })
  @Perm(permissions.READ)
  async info(@IdParam() id: number) {
    return this.roleService.info(id)
  }

  @Post()
  @ApiOperation({ summary: 'Add role' })
  @Perm(permissions.CREATE)
  async create(@Body() dto: RoleDto): Promise<void> {
    await this.roleService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe)dto: RoleUpdateDto): Promise<void> {
    await this.roleService.update(id, dto)
    await this.menuService.refreshOnlineUserPerms()
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    if (await this.roleService.checkUserByRoleId(id))
      throw new BadRequestException('This role has associated users and cannot be deleted')

    await this.roleService.delete(id)
    await this.menuService.refreshOnlineUserPerms()
  }
}
