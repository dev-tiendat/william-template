import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsOptional, IsString } from 'class-validator'

import { PagerDto } from '~/common/dto/pager.dto'

export class LoginLogQueryDto extends PagerDto {
  @ApiProperty({ description: 'User email' })
  @IsString()
  @IsOptional()
  email: string

  @ApiProperty({ description: 'Login IP' })
  @IsOptional()
  @IsString()
  ip?: string

  @ApiProperty({ description: 'Login location' })
  @IsOptional()
  @IsString()
  address?: string

  @ApiProperty({ description: 'Login time' })
  @IsOptional()
  @IsArray()
  time?: string[]
}

export class TaskLogQueryDto extends PagerDto {
  @ApiProperty({ description: 'User email' })
  @IsOptional()
  @IsString()
  email: string

  @ApiProperty({ description: 'Login IP' })
  @IsString()
  @IsOptional()
  ip?: string

  @ApiProperty({ description: 'Login time' })
  @IsOptional()
  time?: string[]
}

export class CaptchaLogQueryDto extends PagerDto {
  @ApiProperty({ description: 'User email' })
  @IsOptional()
  @IsString()
  email: string

  @ApiProperty({ description: 'Verification code' })
  @IsString()
  @IsOptional()
  code?: string

  @ApiProperty({ description: 'Send time' })
  @IsOptional()
  time?: string[]
}
