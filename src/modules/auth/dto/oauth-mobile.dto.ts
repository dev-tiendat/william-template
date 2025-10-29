import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export enum OAuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
}

export class MobileOAuthLoginDto {
  @ApiProperty({
    description: 'OAuth provider (google or apple)',
    enum: OAuthProvider,
    example: 'google',
  })
  @IsEnum(OAuthProvider)
  @IsNotEmpty()
  provider: OAuthProvider

  @ApiProperty({
    description: 'OAuth provider user ID',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  providerId: string

  @ApiProperty({
    description: 'User email from OAuth provider',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    description: 'User full name from OAuth provider',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    description: 'User avatar URL from OAuth provider',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar?: string

  @ApiProperty({
    description: 'OAuth access token from provider',
    example: 'ya29.a0AfH6SMB...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string

  @ApiProperty({
    description: 'OAuth refresh token from provider',
    example: '1//0gL8...',
    required: false,
  })
  @IsString()
  @IsOptional()
  refreshToken?: string

  @ApiProperty({
    description: 'ID token from provider (for verification)',
    example: 'eyJhbGciOiJSUzI1NiIs...',
    required: false,
  })
  @IsString()
  @IsOptional()
  idToken?: string
}
