import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { AuthUser } from '~/modules/auth/decorators/auth-user.decorator'

import { definePermission, Perm } from '~/modules/auth/decorators/permission.decorator'

import { FileUploadDto } from './upload.dto'
import { UploadService } from './upload.service'

export const permissions = definePermission('upload', {
  UPLOAD: 'upload',
} as const)

@ApiSecurityAuth()
@ApiTags('Tools - Upload Module')
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @Perm(permissions.UPLOAD)
  @ApiOperation({ summary: 'Upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FileUploadDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @AuthUser() user: IAuthUser) {
    if (!file)
      throw new BadRequestException('No file uploaded')

    try {
      const path = await this.uploadService.saveFile(file, user.uid)

      return {
        filename: path,
      }
    }
    catch (error) {
      console.log(error)
      throw new BadRequestException('Upload failed')
    }
  }
}
