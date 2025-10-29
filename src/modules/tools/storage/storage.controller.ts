import { Body, Controller, Get, Post, Query } from '@nestjs/common'

import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiResult } from '~/common/decorators/api-result.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'

import { Pagination } from '~/helper/paginate/pagination'

import { definePermission, Perm } from '~/modules/auth/decorators/permission.decorator'

import { StorageDeleteDto, StoragePageDto } from './storage.dto'
import { StorageInfo } from './storage.modal'
import { StorageService } from './storage.service'

export const permissions = definePermission('tool:storage', {
  LIST: 'list',
  DELETE: 'delete',
} as const)

@ApiTags('Tools - Storage Module')
@ApiSecurityAuth()
@Controller('storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get local storage list' })
  @ApiResult({ type: [StorageInfo], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: StoragePageDto): Promise<Pagination<StorageInfo>> {
    return this.storageService.list(dto)
  }

  @ApiOperation({ summary: 'Delete file' })
  @Post('delete')
  @Perm(permissions.DELETE)
  async delete(@Body() dto: StorageDeleteDto): Promise<void> {
    await this.storageService.delete(dto.ids)
  }
}
