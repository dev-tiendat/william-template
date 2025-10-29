import { HttpService } from '@nestjs/axios'
import { BadRequestException, Injectable } from '@nestjs/common'

import { LoggerService } from '~/shared/logger/logger.service'

import { Mission } from '../mission.decorator'

@Injectable()
@Mission()
export class HttpRequestJob {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) { }

  async handle(config: unknown): Promise<void> {
    if (config) {
      const result = await this.httpService.request(config)
      this.logger.log(result, HttpRequestJob.name)
    }
    else {
      throw new BadRequestException('Http request job param is empty')
    }
  }
}
