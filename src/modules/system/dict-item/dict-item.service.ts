import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Like, Repository } from 'typeorm'

import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/pagination'
import { DictItemEntity } from '~/modules/system/dict-item/dict-item.entity'

import { DictItemDto, DictItemQueryDto } from './dict-item.dto'

@Injectable()
export class DictItemService {
  constructor(
    @InjectRepository(DictItemEntity)
    private dictItemRepository: Repository<DictItemEntity>,
  ) {}

  async page({
    page,
    pageSize,
    label,
    value,
    typeId,
  }: DictItemQueryDto): Promise<Pagination<DictItemEntity>> {
    const queryBuilder = this.dictItemRepository.createQueryBuilder('dict_item').orderBy({ orderNo: 'ASC' }).where({
      ...(label && { label: Like(`%${label}%`) }),
      ...(value && { value: Like(`%${value}%`) }),
      type: {
        id: typeId,
      },
    })

    return paginate(queryBuilder, { page, pageSize })
  }

  async countConfigList(): Promise<number> {
    return this.dictItemRepository.count()
  }

  async create(dto: DictItemDto): Promise<void> {
    const { typeId, ...rest } = dto
    await this.dictItemRepository.insert({
      ...rest,
      type: {
        id: typeId,
      },
    })
  }

  async update(id: number, dto: Partial<DictItemDto>): Promise<void> {
    const { typeId, ...rest } = dto
    await this.dictItemRepository.update(id, {
      ...rest,
      type: {
        id: typeId,
      },
    })
  }

  async delete(id: number): Promise<void> {
    await this.dictItemRepository.delete(id)
  }

  async findOne(id: number): Promise<DictItemEntity> {
    return this.dictItemRepository.findOneBy({ id })
  }
}
