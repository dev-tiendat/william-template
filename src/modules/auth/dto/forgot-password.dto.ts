import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator'

export class RequestPasswordResetDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string

  @ApiProperty({ description: '5-digit OTP code', example: '12345', minLength: 5, maxLength: 5 })
  @IsString()
  @Length(5, 5, { message: 'OTP must be exactly 5 digits' })
  @Matches(/^\d{5}$/, { message: 'OTP must contain only digits' })
  otp: string
}

export class ResetPasswordWithOtpDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string

  @ApiProperty({ description: '5-digit OTP code', example: '12345', minLength: 5, maxLength: 5 })
  @IsString()
  @Length(5, 5, { message: 'OTP must be exactly 5 digits' })
  @Matches(/^\d{5}$/, { message: 'OTP must contain only digits' })
  otp: string

  @ApiProperty({
    description: 'New password (6-20 characters, must contain letters and numbers)',
    example: 'NewPassword123',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,20}$/, {
    message: 'Password must contain both letters and numbers, 6-20 characters',
  })
  newPassword: string
}
