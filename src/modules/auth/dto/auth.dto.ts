import { ApiProperty } from '@nestjs/swagger'

import { IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({ description: 'Phone number/Email' })
  @IsString()
  @MinLength(4)
  username: string

  @ApiProperty({ description: 'Password', example: 'a123456' })
  @IsString()
  @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Z])\S*$/i)
  @MinLength(6)
  password: string

  @ApiProperty({ description: 'Captcha identifier' })
  @IsString()
  captchaId: string

  @ApiProperty({ description: 'User input captcha' })
  @IsString()
  @MinLength(4)
  @MaxLength(4)
  verifyCode: string
}

export class RegisterDto {
  @ApiProperty({ description: 'Account' })
  @IsString()
  username: string

  @ApiProperty({ description: 'Password' })
  @IsString()
  @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Z])\S*$/i)
  @MinLength(6)
  @MaxLength(16)
  password: string

  @ApiProperty({ description: 'Language', examples: ['EN', 'ZH'] })
  @IsString()
  lang: string
}
