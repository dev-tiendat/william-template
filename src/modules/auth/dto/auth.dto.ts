import { ApiProperty } from '@nestjs/swagger'

import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ description: 'Password', example: 'Password123' })
  @IsString()
  @MinLength(6)
  password: string
}

export class RegisterDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ description: 'Password (min 6 characters)', example: 'Password123' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string

  @ApiProperty({ description: 'Full name', example: 'John Doe', required: false })
  @IsString()
  fullName?: string
}
