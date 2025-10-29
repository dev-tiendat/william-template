import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Like, Repository } from 'typeorm'

import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/pagination'
import { DictTypeEntity } from '~/modules/system/dict-type/dict-type.entity'

import { DictTypeDto, DictTypeQueryDto } from './dict-type.dto'

@Injectable()
export class DictTypeService {
  constructor(
    @InjectRepository(DictTypeEntity)
    private dictTypeRepository: Repository<DictTypeEntity>,
  ) {}

  async page({
    page,
    pageSize,
    name,
    code,
  }: DictTypeQueryDto): Promise<Pagination<DictTypeEntity>> {
    const queryBuilder = this.dictTypeRepository.createQueryBuilder('dict_type').where({
      ...(name && { name: Like(`%${name}%`) }),
      ...(code && { code: Like(`%${code}%`) }),
    })

    return paginate(queryBuilder, { page, pageSize })
  }

  async getAll() {
    return this.dictTypeRepository.find()
  }

  async countConfigList(): Promise<number> {
    return this.dictTypeRepository.count()
  }

  async create(dto: DictTypeDto): Promise<void> {
    await this.dictTypeRepository.insert(dto)
  }

  async update(id: number, dto: Partial<DictTypeDto>): Promise<void> {
    await this.dictTypeRepository.update(id, dto)
  }

  async delete(id: number): Promise<void> {
    await this.dictTypeRepository.delete(id)
  }

  async findOne(id: number): Promise<DictTypeEntity> {
    return this.dictTypeRepository.findOneBy({ id })
  }
}
