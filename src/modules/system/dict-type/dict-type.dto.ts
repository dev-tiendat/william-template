import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator'

import { PagerDto } from '~/common/dto/pager.dto'

import { IsUnique } from '~/shared/database/constraints/unique.constraint'

import { DictTypeEntity } from './dict-type.entity'

export class DictTypeDto extends PartialType(DictTypeEntity) {
  @ApiProperty({ description: 'Dictionary type name' })
  @IsUnique({ entity: DictTypeEntity, message: 'Dictionary type name already exists' })
  @IsString()
  @MinLength(1)
  name: string

  @ApiProperty({ description: 'Dictionary type code' })
  @IsUnique({ entity: DictTypeEntity, message: 'Dictionary type code already exists' })
  @IsString()
  @MinLength(3)
  code: string

  @ApiProperty({ description: 'Status' })
  @IsOptional()
  @IsInt()
  status?: number

  @ApiProperty({ description: 'Remark' })
  @IsOptional()
  @IsString()
  remark?: string
}

export class DictTypeQueryDto extends PagerDto {
  @ApiProperty({ description: 'Dictionary type name' })
  @IsString()
  @IsOptional()
  name: string

  @ApiProperty({ description: 'Dictionary type code' })
  @IsString()
  @IsOptional()
  code: string
}
