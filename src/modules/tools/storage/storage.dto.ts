import { ApiProperty } from '@nestjs/swagger'
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator'

import { PagerDto } from '~/common/dto/pager.dto'

export class StoragePageDto extends PagerDto {
  @ApiProperty({ description: 'File name' })
  @IsOptional()
  @IsString()
  name: string

  @ApiProperty({ description: 'File extension' })
  @IsString()
  @IsOptional()
  extName: string

  @ApiProperty({ description: 'File type' })
  @IsString()
  @IsOptional()
  type: string

  @ApiProperty({ description: 'Size' })
  @IsString()
  @IsOptional()
  size: string

  @ApiProperty({ description: 'Upload time' })
  @IsOptional()
  time: string[]

  @ApiProperty({ description: 'Uploader' })
  @IsString()
  @IsOptional()
  username: string
}

export class StorageCreateDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Real file name' })
  @IsString()
  fileName: string

  @ApiProperty({ description: '文件扩展名' })
  @IsString()
  extName: string

  @ApiProperty({ description: 'File path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'File path' })
  @IsString()
  type: string

  @ApiProperty({ description: 'File size' })
  @IsString()
  size: string
}

export class StorageDeleteDto {
  @ApiProperty({ description: 'File IDs to delete', type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  ids: number[]
}
