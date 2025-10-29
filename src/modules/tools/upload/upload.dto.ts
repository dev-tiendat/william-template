import { ApiProperty } from '@nestjs/swagger'

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: '文件' })
  file: Express.Multer.File
}
