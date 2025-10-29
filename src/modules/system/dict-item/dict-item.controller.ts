import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiResult } from '~/common/decorators/api-result.decorator'
import { IdParam } from '~/common/decorators/id-param.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { UpdaterPipe } from '~/common/pipes/updater.pipe'
import { Pagination } from '~/helper/paginate/pagination'
import { AuthUser } from '~/modules/auth/decorators/auth-user.decorator'
import { definePermission, Perm } from '~/modules/auth/decorators/permission.decorator'
import { DictItemEntity } from '~/modules/system/dict-item/dict-item.entity'

import { DictItemDto, DictItemQueryDto } from './dict-item.dto'
import { DictItemService } from './dict-item.service'

export const permissions = definePermission('system:dict-item', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
} as const)

@ApiTags('System - Dictionary Item Module')
@ApiSecurityAuth()
@Controller('dict-item')
export class DictItemController {
  constructor(private dictItemService: DictItemService) {}

  @Get()
  @ApiOperation({ summary: 'Get dictionary item list' })
  @ApiResult({ type: [DictItemEntity], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: DictItemQueryDto): Promise<Pagination<DictItemEntity>> {
    return this.dictItemService.page(dto)
  }

  @Post()
  @ApiOperation({ summary: 'Create dictionary item' })
  @Perm(permissions.CREATE)
  async create(@Body() dto: DictItemDto, @AuthUser() user: IAuthUser): Promise<void> {
    await this.dictItemService.create(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dictionary item info' })
  @ApiResult({ type: DictItemEntity })
  @Perm(permissions.READ)
  async info(@IdParam() id: number): Promise<DictItemEntity> {
    return this.dictItemService.findOne(id)
  }

  @Post(':id')
  @ApiOperation({ summary: 'Update dictionary item' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe) dto: DictItemDto): Promise<void> {
    await this.dictItemService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specified dictionary item' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    await this.dictItemService.delete(id)
  }
}
