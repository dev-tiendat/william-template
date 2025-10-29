import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class PasswordUpdateDto {
  @ApiProperty({ description: 'Old password' })
  @IsString()
  @Matches(/^[\s\S]+$/)
  @MinLength(6)
  @MaxLength(20)
  oldPassword: string

  @ApiProperty({ description: 'New password' })
  @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Z])\S*$/i, {
    message: 'Password must contain numbers and letters, length 6-16',
  })
  newPassword: string
}

export class UserPasswordDto {
  // @ApiProperty({ description: '管理员/用户ID' })
  // @IsEntityExist(UserEntity, { message: '用户不存在' })
  // @IsInt()
  // id: number

  @ApiProperty({ description: 'New password' })
  @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Z])\S*$/i, {
    message: 'Password format is incorrect',
  })
  password: string
}

export class UserExistDto {
  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string
}
