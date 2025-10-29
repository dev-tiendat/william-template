import { ApiProperty } from '@nestjs/swagger'

export class AccountInfo {
  @ApiProperty({ description: 'Username' })
  username: string

  @ApiProperty({ description: 'Nickname' })
  nickname: string

  @ApiProperty({ description: 'Email' })
  email: string

  @ApiProperty({ description: 'Phone number' })
  phone: string

  @ApiProperty({ description: 'Remark' })
  remark: string

  @ApiProperty({ description: 'Avatar' })
  avatar: string
}
