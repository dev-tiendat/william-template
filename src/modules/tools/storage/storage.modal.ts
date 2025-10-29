import { ApiProperty } from '@nestjs/swagger'

export class StorageInfo {
  @ApiProperty({ description: 'File ID' })
  id: number

  @ApiProperty({ description: 'File name' })
  name: string

  @ApiProperty({ description: 'File extension' })
  extName: string

  @ApiProperty({ description: 'File path' })
  path: string

  @ApiProperty({ description: 'File type' })
  type: string

  @ApiProperty({ description: 'Size' })
  size: string

  @ApiProperty({ description: 'Upload time' })
  createdAt: string

  @ApiProperty({ description: 'Uploader' })
  username: string
}
