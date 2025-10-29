import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiResult } from '~/common/decorators/api-result.decorator'
import { IdParam } from '~/common/decorators/id-param.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { CreatorPipe } from '~/common/pipes/creator.pipe'
import { UpdaterPipe } from '~/common/pipes/updater.pipe'
import { Pagination } from '~/helper/paginate/pagination'
import { definePermission, Perm } from '~/modules/auth/decorators/permission.decorator'
import { DictTypeEntity } from '~/modules/system/dict-type/dict-type.entity'

import { DictTypeDto, DictTypeQueryDto } from './dict-type.dto'
import { DictTypeService } from './dict-type.service'

export const permissions = definePermission('system:dict-type', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
} as const)

@ApiTags('System - Dictionary Type Module')
@ApiSecurityAuth()
@Controller('dict-type')
export class DictTypeController {
  constructor(private dictTypeService: DictTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get dictionary type list' })
  @ApiResult({ type: [DictTypeEntity], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: DictTypeQueryDto): Promise<Pagination<DictTypeEntity>> {
    return this.dictTypeService.page(dto)
  }

  @Get('select-options')
  @ApiOperation({ summary: 'Get all dictionary types (不分页)' })
  @ApiResult({ type: [DictTypeEntity] })
  @Perm(permissions.LIST)
  async getAll(): Promise<DictTypeEntity[]> {
    return this.dictTypeService.getAll()
  }

  @Post()
  @ApiOperation({ summary: 'Create dictionary type' })
  @Perm(permissions.CREATE)
  async create(@Body(CreatorPipe) dto: DictTypeDto): Promise<void> {
    await this.dictTypeService.create(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dictionary type info' })
  @ApiResult({ type: DictTypeEntity })
  @Perm(permissions.READ)
  async info(@IdParam() id: number): Promise<DictTypeEntity> {
    return this.dictTypeService.findOne(id)
  }

  @Post(':id')
  @ApiOperation({ summary: 'Update dictionary type' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe) dto: DictTypeDto): Promise<void> {
    await this.dictTypeService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specified dictionary type' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    await this.dictTypeService.delete(id)
  }
}
