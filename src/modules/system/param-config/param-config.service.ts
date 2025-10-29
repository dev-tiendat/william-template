import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Repository } from 'typeorm'

import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/pagination'
import { ParamConfigEntity } from '~/modules/system/param-config/param-config.entity'

import { ParamConfigDto, ParamConfigQueryDto } from './param-config.dto'

@Injectable()
export class ParamConfigService {
  constructor(
    @InjectRepository(ParamConfigEntity)
    private paramConfigRepository: Repository<ParamConfigEntity>,
  ) {}

  async page({
    page,
    pageSize,
    name,
  }: ParamConfigQueryDto): Promise<Pagination<ParamConfigEntity>> {
    const queryBuilder = this.paramConfigRepository.createQueryBuilder('config')

    if (name) {
      queryBuilder.where('config.name LIKE :name', {
        name: `%${name}%`,
      })
    }

    return paginate(queryBuilder, { page, pageSize })
  }

  async countConfigList(): Promise<number> {
    return this.paramConfigRepository.count()
  }

  async create(dto: ParamConfigDto): Promise<void> {
    await this.paramConfigRepository.insert(dto)
  }

  async update(id: number, dto: Partial<ParamConfigDto>): Promise<void> {
    await this.paramConfigRepository.update(id, dto)
  }

  async delete(id: number): Promise<void> {
    await this.paramConfigRepository.delete(id)
  }

  async findOne(id: number): Promise<ParamConfigEntity> {
    return this.paramConfigRepository.findOneBy({ id })
  }

  async findValueByKey(key: string): Promise<string | null> {
    const result = await this.paramConfigRepository.findOne({
      where: { key },
      select: ['value'],
    })
    if (result)
      return result.value

    return null
  }
}
