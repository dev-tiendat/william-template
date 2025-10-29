import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator'

import { PagerDto } from '~/common/dto/pager.dto'

import { DictItemEntity } from './dict-item.entity'

export class DictItemDto extends PartialType(DictItemEntity) {
  @ApiProperty({ description: 'Dictionary Type ID' })
  @IsInt()
  typeId: number

  @ApiProperty({ description: 'Dictionary item label' })
  @IsString()
  @MinLength(1)
  label: string

  @ApiProperty({ description: 'Dictionary item value' })
  @IsString()
  @MinLength(1)
  value: string

  @ApiProperty({ description: 'Status' })
  @IsOptional()
  @IsInt()
  status?: number

  @ApiProperty({ description: 'Remark' })
  @IsOptional()
  @IsString()
  remark?: string
}

export class DictItemQueryDto extends PagerDto {
  @ApiProperty({ description: 'Dictionary Type ID', required: true })
  @IsInt()
  typeId: number

  @ApiProperty({ description: 'Dictionary item label' })
  @IsString()
  @IsOptional()
  label?: string

  @ApiProperty({ description: 'Dictionary item value' })
  @IsString()
  @IsOptional()
  value?: string
}
