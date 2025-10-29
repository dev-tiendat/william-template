import { ApiProperty } from '@nestjs/swagger'

export class ImageCaptcha {
  @ApiProperty({ description: 'Base64 format SVG image' })
  img: string

  @ApiProperty({ description: 'Unique ID corresponding to the captcha' })
  id: string
}

export class LoginToken {
  @ApiProperty({ description: 'JWT authentication token' })
  token: string
}
