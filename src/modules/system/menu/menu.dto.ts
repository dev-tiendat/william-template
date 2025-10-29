import { ApiProperty, PartialType } from '@nestjs/swagger'
import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

import { OperatorDto } from '~/common/dto/operator.dto'

export class MenuDto extends OperatorDto {
  @ApiProperty({ description: 'Menu name' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ description: 'Menu path', required: false })
  @IsString()
  @IsOptional()
  path?: string

  @ApiProperty({ description: 'Menu permission', required: false })
  @IsString()
  @IsOptional()
  permission?: string

  @ApiProperty({ description: 'Status: 0 disabled, 1 enabled', default: 1 })
  @IsIn([0, 1])
  status: number
}

export class MenuUpdateDto extends PartialType(MenuDto) {}

export class MenuQueryDto extends PartialType(MenuDto) {}
