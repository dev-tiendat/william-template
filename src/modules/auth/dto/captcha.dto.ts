import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsEmail,
  IsInt,
  IsMobilePhone,
  IsOptional,
  IsString,
} from 'class-validator'

export class ImageCaptchaDto {
  @ApiProperty({
    required: false,
    default: 100,
    description: 'Captcha width',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly width: number = 100

  @ApiProperty({
    required: false,
    default: 50,
    description: 'Captcha height',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly height: number = 50
}

export class SendEmailCodeDto {
  @ApiProperty({ description: 'Email' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string
}

export class SendSmsCodeDto {
  @ApiProperty({ description: 'Phone number' })
  @IsMobilePhone('zh-CN', {}, { message: 'Invalid phone number format' })
  phone: string
}

export class CheckCodeDto {
  @ApiProperty({ description: 'Phone number/Email' })
  @IsString()
  account: string

  @ApiProperty({ description: 'Verification code' })
  @IsString()
  code: string
}
