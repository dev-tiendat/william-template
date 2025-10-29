import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger'
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

import { MenuEntity } from '~/modules/system/menu/menu.entity'

export class AccountUpdateDto {
  @ApiProperty({ description: 'User email' })
  @IsOptional()
  @IsEmail()
  email: string

  @ApiProperty({ description: 'User full name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName: string

  @ApiProperty({ description: 'User avatar URL' })
  @IsOptional()
  @IsString()
  avatarUrl: string
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Temporary token', example: 'uuid' })
  @IsString()
  accessToken: string

  @ApiProperty({ description: 'Password', example: 'a123456' })
  @IsString()
  @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Z])\S*$/i)
  @MinLength(6)
  password: string
}

export class MenuMeta {
  @ApiProperty({ description: 'Menu title' })
  title: string

  @ApiProperty({ description: 'Menu permission' })
  permission?: string

  @ApiProperty({ description: 'Menu status' })
  status?: number
}

export class AccountMenus extends PickType(MenuEntity, ['id', 'path', 'name'] as const) {
  @ApiProperty({ type: MenuMeta })
  meta: MenuMeta
}
