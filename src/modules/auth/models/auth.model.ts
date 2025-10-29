import { ApiProperty } from '@nestjs/swagger'
import { AccountInfo } from '~/modules/user/user.model'

export class ImageCaptcha {
  @ApiProperty({ description: 'Base64 format SVG image' })
  img: string

  @ApiProperty({ description: 'Unique ID corresponding to the captcha' })
  id: string
}

export class TokenInfo {
  @ApiProperty({ description: 'Access token' })
  accessToken: string

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string
}

export class LoginToken {
  @ApiProperty({ description: 'JWT authentication token' })
  token: string
}

export class LoginResponse {
  @ApiProperty({ description: 'User basic information', type: AccountInfo })
  user: AccountInfo

  @ApiProperty({ description: 'Authentication tokens', type: TokenInfo })
  tokens: TokenInfo
}
