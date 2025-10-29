import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager'
import { Controller, Get, UseInterceptors } from '@nestjs/common'
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiResult } from '~/common/decorators/api-result.decorator'

import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'

import { AllowAnon } from '~/modules/auth/decorators/allow-anon.decorator'

import { ServeStatInfo } from './serve.model'
import { ServeService } from './serve.service'

@ApiTags('System - Serve Monitoring')
@ApiSecurityAuth()
@ApiExtraModels(ServeStatInfo)
@Controller('serve')
@UseInterceptors(CacheInterceptor)
@CacheKey('serve_stat')
@CacheTTL(10000)
export class ServeController {
  constructor(private serveService: ServeService) {}

  @Get('stat')
  @ApiOperation({ summary: 'Get server running information' })
  @ApiResult({ type: ServeStatInfo })
  @AllowAnon()
  async stat(): Promise<ServeStatInfo> {
    return this.serveService.getServeStat()
  }
}
